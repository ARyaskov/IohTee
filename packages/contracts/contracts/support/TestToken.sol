// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.11;

import "./ERC20Mintable.sol";

contract TestToken is ERC20Mintable {
    constructor() public ERC20Mintable("TestToken", "TESTT") {

    }
}
