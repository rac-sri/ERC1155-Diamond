const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("ERC1155Burnable", function () {
  const uri = "https://token.com";

  let holder, operator, other;

  const tokenIds = [BigNumber.from(42), BigNumber.from(1137)];
  const amounts = [BigNumber.from(3000), BigNumber.from(9902)];

  beforeEach(async function () {
    [holder, operator, other] = await ethers.getSigners();
    const ERC1155BurnableMock = await ethers.getContractFactory(
      "ERC1155BurnableMock"
    );

    this.token = await ERC1155BurnableMock.deploy();

    await this.token.mint(holder.address, tokenIds[0], amounts[0], "0x");
    await this.token.mint(holder.address, tokenIds[1], amounts[1], "0x");
  });

  describe("burn", function () {
    it("holder can burn their tokens", async function () {
      await this.token
        .connect(holder)
        .burn(holder.address, tokenIds[0], amounts[0].sub(1));

      expect(
        await this.token.balanceOf(holder.address, tokenIds[0])
      ).to.deep.equal("1");
    });

    it("approved operators can burn the holder's tokens", async function () {
      await this.token
        .connect(holder)
        .setApprovalForAll(operator.address, true);
      await this.token
        .connect(holder)
        .burn(holder.address, tokenIds[0], amounts[0].sub(1));

      expect(
        await this.token.balanceOf(holder.address, tokenIds[0])
      ).to.deep.equal("1");
    });

    it("unapproved accounts cannot burn the holder's tokens", async function () {
      await expectRevert(
        this.token
          .connect(other)
          .burn(holder.address, tokenIds[0], amounts[0].sub(1)),
        "ERC1155: caller is not token owner or approved"
      );
    });
  });

  describe("burnBatch", function () {
    it("holder can burn their tokens", async function () {
      await this.token
        .connect(holder)
        .burnBatch(holder.address, tokenIds, [
          amounts[0].sub(1),
          amounts[1].sub(2),
        ]);

      expect(
        await this.token.balanceOf(holder.address, tokenIds[0])
      ).to.deep.equal("1");
      expect(
        await this.token.balanceOf(holder.address, tokenIds[1])
      ).to.deep.equal("2");
    });

    it("approved operators can burn the holder's tokens", async function () {
      await this.token
        .connect(holder)
        .setApprovalForAll(operator.address, true);
      await this.token
        .connect(operator)
        .burnBatch(holder.address, tokenIds, [
          amounts[0].sub(1),
          amounts[1].sub(2),
        ]);

      expect(
        await this.token.balanceOf(holder.address, tokenIds[0])
      ).to.deep.equal("1");
      expect(
        await this.token.balanceOf(holder.address, tokenIds[1])
      ).to.deep.equal("2");
    });

    it("unapproved accounts cannot burn the holder's tokens", async function () {
      await expectRevert(
        this.token
          .connect(other)
          .burnBatch(holder.address, tokenIds, [
            amounts[0].sub(1),
            amounts[1].sub(2),
          ]),
        "ERC1155: caller is not token owner or approved"
      );
    });
  });
});
