// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title Upgradeable unidirectional Ether payment channels contract (UUPS).
contract UnidirectionalUpgradeable is
    Initializable,
    Ownable2StepUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    struct PaymentChannel {
        address payable sender;
        address payable receiver;
        uint256 value;
        uint256 settlingPeriod;
        uint256 settlingUntil;
    }

    mapping(bytes32 => PaymentChannel) public channels;

    event DidOpen(bytes32 indexed channelId, address indexed sender, address indexed receiver, uint256 value);
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
    error EthTransferFailed();

    /// @notice Initializes the implementation behind proxy.
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

    function open(bytes32 channelId, address receiver, uint256 settlingPeriod) external payable whenNotPaused nonReentrant {
        if (receiver == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert ZeroValue();
        if (settlingPeriod == 0) revert ZeroSettlementPeriod();
        if (!isAbsent(channelId)) revert ChannelAlreadyExists(channelId);

        channels[channelId] = PaymentChannel({
            sender: payable(msg.sender),
            receiver: payable(receiver),
            value: msg.value,
            settlingPeriod: settlingPeriod,
            settlingUntil: 0
        });

        emit DidOpen(channelId, msg.sender, receiver, msg.value);
    }

    function canDeposit(bytes32 channelId, address origin) public view returns (bool) {
        PaymentChannel memory channel = channels[channelId];
        return isOpen(channelId) && channel.sender == origin;
    }

    function deposit(bytes32 channelId) external payable whenNotPaused nonReentrant {
        if (msg.value == 0) revert ZeroValue();
        if (!canDeposit(channelId, msg.sender)) revert NotSender(channelId, msg.sender);
        channels[channelId].value += msg.value;
        emit DidDeposit(channelId, msg.value);
    }

    function canStartSettling(bytes32 channelId, address origin) public view returns (bool) {
        PaymentChannel memory channel = channels[channelId];
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
        _safeTransferETH(channel.sender, channel.value);
        emit DidSettle(channelId);
    }

    function canClaim(bytes32 channelId, uint256 payment, address origin, bytes memory signature) public view returns (bool) {
        PaymentChannel memory channel = channels[channelId];
        if (channel.sender == address(0)) return false;
        if (origin != channel.receiver) return false;

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(paymentDigest(channelId, payment));
        (address recovered, ECDSA.RecoverError recoverError,) = ECDSA.tryRecover(digest, signature);
        return recoverError == ECDSA.RecoverError.NoError && channel.sender == recovered;
    }

    function claim(bytes32 channelId, uint256 payment, bytes memory signature) external whenNotPaused nonReentrant {
        PaymentChannel memory channel = channels[channelId];
        if (channel.sender == address(0)) revert ChannelDoesNotExist(channelId);
        if (msg.sender != channel.receiver) revert NotReceiver(channelId, msg.sender);
        if (!canClaim(channelId, payment, msg.sender, signature)) revert InvalidSignature(channelId);

        delete channels[channelId];

        if (payment >= channel.value) {
            _safeTransferETH(channel.receiver, channel.value);
        } else {
            _safeTransferETH(channel.receiver, payment);
            _safeTransferETH(channel.sender, channel.value - payment);
        }

        emit DidClaim(channelId);
    }

    function isPresent(bytes32 channelId) public view returns (bool) {
        return !isAbsent(channelId);
    }

    function isAbsent(bytes32 channelId) public view returns (bool) {
        return channels[channelId].sender == address(0);
    }

    function isSettling(bytes32 channelId) public view returns (bool) {
        return channels[channelId].settlingUntil != 0;
    }

    function isOpen(bytes32 channelId) public view returns (bool) {
        return isPresent(channelId) && !isSettling(channelId);
    }

    function paymentDigest(bytes32 channelId, uint256 payment) public view returns (bytes32) {
        return keccak256(abi.encode(address(this), channelId, payment));
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _safeTransferETH(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert EthTransferFailed();
    }

    uint256[50] private __gap;
}
