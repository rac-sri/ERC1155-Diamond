<!-- [![Docs][docs-shield]][docs-url]
[![NPM][npm-shield]][npm-url]
[![CI][ci-shield]][ci-url]
[![Issues][issues-shield]][issues-url] -->

[![MIT License][license-shield]][license-url]

<!-- OTHER BADGES -->
<!-- [![Contributors][contributors-shield]][contributors-url] -->
<!-- [![Forks][forks-shield]][forks-url] -->
<!-- [![Stargazers][stars-shield]][stars-url] -->

## About The Project

This repository hosts the Upgradeable variant of [ERC1155](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol), meant for use in upgradeable contracts. This variant is available as separate package called `EIP1155-Diamond`.

This version uses the [diamond storage layout pattern](https://eips.ethereum.org/EIPS/eip-2535).

It follows all of the rules for [Writing Upgradeable Contracts]: constructors are replaced by initializer functions, state variables are initialized in initializer functions, and we additionally check for storage incompatibilities across minor versions.

[writing upgradeable contracts]: https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable

> **Warning**

<!-- >
> There will be storage incompatibilities across major versions of this package, which makes it unsafe to upgrade a deployed contract from one major version to another, for example from 3.4.0 to 4.0.0.
> -->

> **It is strongly encouraged to use these contracts together with a tool that can simplify the deployment of upgradeable contracts, such as [OpenZeppelin Upgrades Plugins](https://github.com/OpenZeppelin/openzeppelin-upgrades) and to avoid storage incompatibilities**

**Rachit2501 is not liable for any outcomes as a result of using ERC1155-Diamond.** DYOR.

<!-- Docs -->

<!-- Installation -->

## Installation

```sh

npm install --save-dev erc721a-upgradeable

```

<!-- USAGE EXAMPLES -->

## Usage

Once installed, you can use the contracts in the library by importing them:

```solidity
pragma solidity ^0.8.4;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

contract Something is ERC1155, OwnableUpgradeable {

    function initialize() initializerERC721A initializer public {

        __Ownable_init();
    }

}

```

<!-- CONTRIBUTING -->

## Contributing

If you want to make a contribution:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Running tests locally

1. `npm install`
2. `npx hardhat test`

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<!-- CONTACT -->

## Contact

- RacSri25 ( https://twitter.com/RacSri25 )

<!-- MARKDOWN LINKS & IMAGES -->

<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[docs-shield]: https://img.shields.io/badge/docs-%F0%9F%93%84-blue?style=for-the-badge
[docs-url]: https://chiru-labs.github.io/ERC721A/#/upgradeable
[npm-shield]: https://img.shields.io/npm/v/erc721a-upgradeable.svg?style=for-the-badge
[npm-url]: https://www.npmjs.com/package/erc721a-upgradeable
[ci-shield]: https://img.shields.io/github/workflow/status/chiru-labs/ERC721A-Upgradeable/ERC721A%20Upgradeable%20CI?label=build&style=for-the-badge
[ci-url]: https://github.com/chiru-labs/ERC721A-Upgradeable/actions/workflows/run_tests.yml
[issues-shield]: https://img.shields.io/github/issues/chiru-labs/ERC721A-Upgradeable.svg?style=for-the-badge
[issues-url]: https://github.com/chiru-labs/ERC721A-Upgradeable/issues
[license-shield]: https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge
[license-url]: https://github.com/chiru-labs/ERC721A-Upgradeable/blob/main/LICENSE.txt
