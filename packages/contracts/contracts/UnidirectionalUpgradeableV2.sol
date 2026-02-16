// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "./UnidirectionalUpgradeable.sol";

/// @notice Test implementation for upgrade checks.
contract UnidirectionalUpgradeableV2 is UnidirectionalUpgradeable {
    function version() external pure returns (uint256) {
        return 2;
    }
}
