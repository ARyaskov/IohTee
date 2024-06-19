// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";


contract SigTest {
    function testSig(bytes32 channelId, uint256 payment, bytes memory signature) public view returns(address) {
        bytes32 hash = paymentDigest(channelId, payment);
        address restored = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(hash), signature);

        return restored;
    }

    function paymentDigest(bytes32 channelId, uint256 payment) public view returns(bytes32) {
        return keccak256(abi.encode(address(this), channelId, payment));
    }
}
