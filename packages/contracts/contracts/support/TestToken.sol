// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract TestToken is ERC20 {
    constructor(string memory name_, string memory symbol_) public ERC20(name_, symbol_) {

    }
}
