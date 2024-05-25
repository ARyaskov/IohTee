// SPDX-License-Identifier: MIT
// Source: OpenZeppelin Solidity v2 code, MIT
pragma solidity 0.8.20;

import "./Roles.sol";


contract MinterRole {
    using Roles for Roles.Role;

    Roles.Role private minters;

    constructor() {
        minters.add(msg.sender);
    }

    modifier onlyMinter() {
        require(isMinter(msg.sender));
        _;
    }

    function isMinter(address _account) public view returns (bool) {
        return minters.has(_account);
    }

    function addMinter(address _account) public onlyMinter {
        minters.add(_account);
    }

    function renounceMinter() public {
        minters.remove(msg.sender);
    }

    function _removeMinter(address _account) internal {
        minters.remove(_account);
    }
}
