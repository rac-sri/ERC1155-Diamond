// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library ERC1155ReceiverStorage {
    // Bypass for a `--via-ir` bug (https://github.com/chiru-labs/ERC721A/pull/364).
    struct TokenApprovalRef {
        address value;
    }

    struct Layout {
    // =============================================================
    //                            STORAGE
    // =============================================================
    bytes4  _recRetval;
    bool  _recReverts;
    bytes4  _batRetval;
    bool  _batReverts;
    }

    bytes32 internal constant STORAGE_SLOT = keccak256('ERC1155.receiver.contracts.storage.ERC1155');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
