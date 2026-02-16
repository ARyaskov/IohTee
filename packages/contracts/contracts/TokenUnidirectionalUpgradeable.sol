// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title Upgradeable unidirectional ERC20 payment channels contract (UUPS).
contract TokenUnidirectionalUpgradeable is
    Initializable,
    Ownable2StepUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    struct PaymentChannel {
        address sender;
        address receiver;
        uint256 value;
        uint256 settlingPeriod;
        uint256 settlingUntil;
        address tokenContract;
    }

    mapping(bytes32 => PaymentChannel) public channels;

    event DidOpen(
        bytes32 indexed channelId,
        address indexed sender,
        address indexed receiver,
        uint256 value,
        address tokenContract
    );
    event DidDeposit(bytes32 indexed channelId, uint256 deposit);
    event DidClaim(bytes32 indexed channelId);
    event DidStartSettling(bytes32 indexed channelId);
    event DidSettle(bytes32 indexed channelId);

    error ZeroAddress();
    error ZeroValue();
    error ZeroSettlementPeriod();
    error ChannelAlreadyExists(bytes32 channelId);
    error ChannelDoesNotExist(bytes32 channelId);
    error NotSender(bytes32 channelId, address caller);
    error NotReceiver(bytes32 channelId, address caller);
    error NotSettling(bytes32 channelId);
    error SettleWindowNotReached(bytes32 channelId, uint256 currentBlock, uint256 settleAt);
    error InvalidSignature(bytes32 channelId);

    function initialize(address initialOwner) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();
        __Ownable_init(initialOwner);
        __Ownable2Step_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function open(bytes32 channelId, address receiver, uint256 settlingPeriod, address tokenContract, uint256 value)
        external
        whenNotPaused
        nonReentrant
    {
        if (receiver == address(0) || tokenContract == address(0)) revert ZeroAddress();
        if (value == 0) revert ZeroValue();
        if (settlingPeriod == 0) revert ZeroSettlementPeriod();
        if (!isAbsent(channelId)) revert ChannelAlreadyExists(channelId);

        IERC20(tokenContract).safeTransferFrom(msg.sender, address(this), value);

        channels[channelId] = PaymentChannel({
            sender: msg.sender,
            receiver: receiver,
            value: value,
            settlingPeriod: settlingPeriod,
            settlingUntil: 0,
            tokenContract: tokenContract
        });

        emit DidOpen(channelId, msg.sender, receiver, value, tokenContract);
    }

    function canDeposit(bytes32 channelId, address origin) public view returns (bool) {
        PaymentChannel storage channel = channels[channelId];
        return isOpen(channelId) && channel.sender == origin;
    }

    function deposit(bytes32 channelId, uint256 value) external whenNotPaused nonReentrant {
        if (value == 0) revert ZeroValue();
        if (!canDeposit(channelId, msg.sender)) revert NotSender(channelId, msg.sender);

        PaymentChannel storage channel = channels[channelId];
        IERC20(channel.tokenContract).safeTransferFrom(msg.sender, address(this), value);
        channel.value += value;

        emit DidDeposit(channelId, value);
    }

    function canStartSettling(bytes32 channelId, address origin) public view returns (bool) {
        PaymentChannel storage channel = channels[channelId];
        return isOpen(channelId) && channel.sender == origin;
    }

    function startSettling(bytes32 channelId) external whenNotPaused {
        if (!canStartSettling(channelId, msg.sender)) revert NotSender(channelId, msg.sender);
        PaymentChannel storage channel = channels[channelId];
        channel.settlingUntil = block.number + channel.settlingPeriod;
        emit DidStartSettling(channelId);
    }

    function canSettle(bytes32 channelId) public view returns (bool) {
        if (!isSettling(channelId)) return false;
        return block.number >= channels[channelId].settlingUntil;
    }

    function settle(bytes32 channelId) external whenNotPaused nonReentrant {
        if (!isPresent(channelId)) revert ChannelDoesNotExist(channelId);
        if (!isSettling(channelId)) revert NotSettling(channelId);

        PaymentChannel memory channel = channels[channelId];
        if (block.number < channel.settlingUntil) {
            revert SettleWindowNotReached(channelId, block.number, channel.settlingUntil);
        }

        delete channels[channelId];
        IERC20(channel.tokenContract).safeTransfer(channel.sender, channel.value);
        emit DidSettle(channelId);
    }

    function canClaim(bytes32 channelId, uint256 payment, address origin, bytes memory signature) public view returns (bool) {
        PaymentChannel memory channel = channels[channelId];
        if (channel.sender == address(0)) return false;
        if (origin != channel.receiver) return false;

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(paymentDigest(channelId, payment, channel.tokenContract));
        (address recovered, ECDSA.RecoverError recoverError,) = ECDSA.tryRecover(digest, signature);
        return recoverError == ECDSA.RecoverError.NoError && channel.sender == recovered;
    }

    function claim(bytes32 channelId, uint256 payment, bytes memory signature) external whenNotPaused nonReentrant {
        PaymentChannel memory channel = channels[channelId];
        if (channel.sender == address(0)) revert ChannelDoesNotExist(channelId);
        if (msg.sender != channel.receiver) revert NotReceiver(channelId, msg.sender);
        if (!canClaim(channelId, payment, msg.sender, signature)) revert InvalidSignature(channelId);

        delete channels[channelId];

        IERC20 token = IERC20(channel.tokenContract);
        if (payment >= channel.value) {
            token.safeTransfer(channel.receiver, channel.value);
        } else {
            token.safeTransfer(channel.receiver, payment);
            token.safeTransfer(channel.sender, channel.value - payment);
        }

        emit DidClaim(channelId);
    }

    function isAbsent(bytes32 channelId) public view returns (bool) {
        return channels[channelId].sender == address(0);
    }

    function isPresent(bytes32 channelId) public view returns (bool) {
        return !isAbsent(channelId);
    }

    function isSettling(bytes32 channelId) public view returns (bool) {
        return channels[channelId].settlingUntil != 0;
    }

    function isOpen(bytes32 channelId) public view returns (bool) {
        return isPresent(channelId) && !isSettling(channelId);
    }

    function paymentDigest(bytes32 channelId, uint256 payment, address tokenContract) public view returns (bytes32) {
        return keccak256(abi.encode(address(this), channelId, payment, tokenContract));
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    uint256[50] private __gap;
}
