// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC1155/extensions/ERC1155URIStorage.sol)

pragma solidity ^0.8.0;

import "../helpers/Strings.sol";
import "../ERC1155.sol";

/**
 * @dev ERC1155 token with storage based token URI management.
 * Inspired by the ERC721URIStorage extension
 *
 * _Available since v4.6._
 */
abstract contract ERC1155URIStorage is ERC1155 {
    using Strings for uint256;

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * This implementation returns the concatenation of the `ERC1155Storage.layout()._baseURI`
     * and the token-specific uri if the latter is set
     *
     * This enables the following behaviors:
     *
     * - if `ERC1155Storage.layout()._tokenURIs[tokenId]` is set, then the result is the concatenation
     *   of `ERC1155Storage.layout()._baseURI` and `ERC1155Storage.layout()._tokenURIs[tokenId]` (keep in mind that `ERC1155Storage.layout()._baseURI`
     *   is empty per default);
     *
     * - if `ERC1155Storage.layout()._tokenURIs[tokenId]` is NOT set then we fallback to `super.uri()`
     *   which in most cases will contain `ERC1155._uri`;
     *
     * - if `ERC1155Storage.layout()._tokenURIs[tokenId]` is NOT set, and if the parents do not have a
     *   uri value set, then the result is empty.
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory tokenURI = ERC1155Storage.layout()._tokenURIs[tokenId];

        // If token URI is set, concatenate base URI and tokenURI (via abi.encodePacked).
        return bytes(tokenURI).length > 0 ? string(abi.encodePacked(ERC1155Storage.layout()._baseURI, tokenURI)) : super.uri(tokenId);
    }

    /**
     * @dev Sets `tokenURI` as the tokenURI of `tokenId`.
     */
    function _setURI(uint256 tokenId, string memory tokenURI) internal virtual {
        ERC1155Storage.layout()._tokenURIs[tokenId] = tokenURI;
        emit URI(uri(tokenId), tokenId);
    }

    /**
     * @dev Sets `baseURI` as the `ERC1155Storage.layout()._baseURI` for all tokens
     */
    function _setBaseURI(string memory baseURI) internal virtual {
        ERC1155Storage.layout()._baseURI = baseURI;
    }
}