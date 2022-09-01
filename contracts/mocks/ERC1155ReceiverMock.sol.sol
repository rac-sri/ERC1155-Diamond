// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../interface/IERC1155Receiver.sol";
import "../ERC165.sol";
import "../ERC1155ReceiverStorage.sol";

contract ERC1155ReceiverMock is ERC165, IERC1155Receiver {

    event Received(address operator, address from, uint256 id, uint256 value, bytes data, uint256 gas);
    event BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data, uint256 gas);

//   TODO: Make initializable
    function initialize(
        bytes4 recRetval,
        bool recReverts,
        bytes4 batRetval,
        bool batReverts
    ) external {
        ERC1155ReceiverStorage.layout()._recRetval = recRetval;
        ERC1155ReceiverStorage.layout()._recReverts = recReverts;
        ERC1155ReceiverStorage.layout()._batRetval = batRetval;
        ERC1155ReceiverStorage.layout()._batReverts = batReverts;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        require(!ERC1155ReceiverStorage.layout()._recReverts, "ERC1155ReceiverMock: reverting on receive");
        emit Received(operator, from, id, value, data, gasleft());
        return ERC1155ReceiverStorage.layout()._recRetval;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        require(!ERC1155ReceiverStorage.layout()._batReverts, "ERC1155ReceiverMock: reverting on batch receive");
        emit BatchReceived(operator, from, ids, values, data, gasleft());
        return ERC1155ReceiverStorage.layout()._batRetval;
    }
}