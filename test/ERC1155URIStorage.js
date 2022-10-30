const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("ERC1155URIStorage", function () {
  let holder;
  let ERC1155URIStorageMock;
  const erc1155Uri = "https://token.com/nfts/";
  const baseUri = "https://token.com/";

  const tokenId = BigNumber.from("1");
  const amount = BigNumber.from("3000");

  describe("with base uri set", function () {
    beforeEach(async function () {
      [holder] = await ethers.getSigners();
      ERC1155URIStorageMock = await ethers.getContractFactory(
        "ERC1155URIStorageMock"
      );

      this.token = await ERC1155URIStorageMock.deploy(erc1155Uri);

      this.token["setURI(uint256,string)"](tokenId, "nfts/");
      this.token.setBaseURI(baseUri);

      await this.token.mint(holder.address, tokenId, amount, "0x");
    });

    it("can request the token uri, returning the erc1155 uri if no token uri was set", async function () {
      const receivedTokenUri = await this.token.uri(tokenId);

      expect(receivedTokenUri).to.be.equal(erc1155Uri);
    });

    it("can request the token uri, returning the concatenated uri if a token uri was set", async function () {
      const tokenUri = "1234/";
      const receipt = await this.token["setURI(uint256,string)"](
        tokenId,
        tokenUri
      );

      const receivedTokenUri = await this.token.uri(tokenId);

      const expectedUri = `${baseUri}${tokenUri}`;
      expect(receivedTokenUri).to.be.equal(expectedUri);
    });
  });

  describe("with base uri set to the empty string", function () {
    beforeEach(async function () {
      this.token = await ERC1155URIStorageMock.deploy("");

      await this.token.mint(holder.address, tokenId, amount, "0x");
    });

    it("can request the token uri, returning an empty string if no token uri was set", async function () {
      const receivedTokenUri = await this.token.uri(tokenId);

      expect(receivedTokenUri).to.be.equal("");
    });

    it("can request the token uri, returning the token uri if a token uri was set", async function () {
      const tokenUri = "ipfs://1234/";
      const receipt = await this.token["setURI(uint256,string)"](
        tokenId,
        tokenUri
      );

      const receivedTokenUri = await this.token.uri(tokenId);

      expect(receivedTokenUri).to.be.equal(tokenUri);
    });
  });
});
