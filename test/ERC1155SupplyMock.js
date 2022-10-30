const { BN, expectRevert } = require("@openzeppelin/test-helpers");

const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { expect } = require("chai");

describe("ERC1155Supply", function () {
  let holder;

  const uri = "https://token.com";

  const firstTokenId = BigNumber.from("37");
  const firstTokenAmount = BigNumber.from("42");

  const secondTokenId = BigNumber.from("19842");
  const secondTokenAmount = BigNumber.from("23");

  beforeEach(async function () {
    [holder] = await ethers.getSigners();
    const ERC1155SupplyMock = await ethers.getContractFactory(
      "ERC1155SupplyMock"
    );

    this.token = await ERC1155SupplyMock.deploy(uri);
  });

  describe("before mint", function () {
    it("exist", async function () {
      expect(await this.token.exists(firstTokenId)).to.be.equal(false);
    });

    it("totalSupply", async function () {
      expect(await this.token.totalSupply(firstTokenId)).to.deep.equal("0");
    });
  });

  describe("after mint", function () {
    describe("single", function () {
      beforeEach(async function () {
        await this.token.mint(
          holder.address,
          firstTokenId,
          firstTokenAmount,
          "0x"
        );
      });

      it("exist", async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(true);
      });

      it("totalSupply", async function () {
        expect(await this.token.totalSupply(firstTokenId)).to.deep.equal(
          firstTokenAmount
        );
      });
    });

    describe("batch", function () {
      beforeEach(async function () {
        await this.token.mintBatch(
          holder.address,
          [firstTokenId, secondTokenId],
          [firstTokenAmount, secondTokenAmount],
          "0x"
        );
      });

      it("exist", async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(true);
        expect(await this.token.exists(secondTokenId)).to.be.equal(true);
      });

      it("totalSupply", async function () {
        expect(await this.token.totalSupply(firstTokenId)).to.deep.equal(
          firstTokenAmount
        );
        expect(await this.token.totalSupply(secondTokenId)).to.deep.equal(
          secondTokenAmount
        );
      });
    });
  });

  describe("after burn", function () {
    describe("single", function () {
      beforeEach(async function () {
        await this.token.mint(
          holder.address,
          firstTokenId,
          firstTokenAmount,
          "0x"
        );
        await this.token.burn(holder.address, firstTokenId, firstTokenAmount);
      });

      it("exist", async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(false);
      });

      it("totalSupply", async function () {
        expect(await this.token.totalSupply(firstTokenId)).to.deep.equal("0");
      });
    });

    describe("batch", function () {
      beforeEach(async function () {
        await this.token.mintBatch(
          holder.address,
          [firstTokenId, secondTokenId],
          [firstTokenAmount, secondTokenAmount],
          "0x"
        );
        await this.token.burnBatch(
          holder.address,
          [firstTokenId, secondTokenId],
          [firstTokenAmount, secondTokenAmount]
        );
      });

      it("exist", async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(false);
        expect(await this.token.exists(secondTokenId)).to.be.equal(false);
      });

      it("totalSupply", async function () {
        expect(await this.token.totalSupply(firstTokenId)).to.deep.equal("0");
        expect(await this.token.totalSupply(secondTokenId)).to.deep.equal("0");
      });
    });
  });
});
