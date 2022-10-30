// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../extensions/ERC1155Burnable.sol";

contract ERC1155BurnableMock is ERC1155Burnable {
    constructor(string memory uri)  {}

    function mint(
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public {
        _mint(to, id, value, data);
    }
}