const { BN, expectRevert } = require("@openzeppelin/test-helpers");

const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { expect } = require("chai");

describe("ERC1155Pausable", function () {
  let holder, operator, receiver, other;

  const uri = "https://token.com";

  beforeEach(async function () {
    const ERC1155PausableMock = await ethers.getContractFactory(
      "ERC1155PausableMock"
    );

    this.token = await ERC1155PausableMock.deploy(uri);
  });

  describe("when token is paused", function () {
    const firstTokenId = BigNumber.from(37);
    const firstTokenAmount = BigNumber.from(42);

    const secondTokenId = BigNumber.from(19842);
    const secondTokenAmount = BigNumber.from(23);

    beforeEach(async function () {
      [holder, operator, receiver, other] = await ethers.getSigners();
      await this.token
        .connect(holder)
        .setApprovalForAll(operator.address, true);
      await this.token.mint(
        holder.address,
        firstTokenId,
        firstTokenAmount,
        "0x"
      );

      await this.token.pause();
    });

    it("reverts when trying to safeTransferFrom from holder", async function () {
      await expectRevert(
        this.token
          .connect(holder)
          .safeTransferFrom(
            holder.address,
            receiver.address,
            firstTokenId,
            firstTokenAmount,
            "0x"
          ),
        "ERC1155Pausable: token transfer while paused"
      );
    });

    it("reverts when trying to safeTransferFrom from operator", async function () {
      await expectRevert(
        this.token
          .connect(operator)
          .safeTransferFrom(
            holder.address,
            receiver.address,
            firstTokenId,
            firstTokenAmount,
            "0x"
          ),
        "ERC1155Pausable: token transfer while paused"
      );
    });

    it("reverts when trying to safeBatchTransferFrom from holder", async function () {
      await expectRevert(
        this.token
          .connect(holder)
          .safeBatchTransferFrom(
            holder.address,
            receiver.address,
            [firstTokenId],
            [firstTokenAmount],
            "0x"
          ),
        "ERC1155Pausable: token transfer while paused"
      );
    });

    it("reverts when trying to safeBatchTransferFrom from operator", async function () {
      await expectRevert(
        this.token
          .connect(holder)
          .safeBatchTransferFrom(
            holder.address,
            receiver.address,
            [firstTokenId],
            [firstTokenAmount],
            "0x"
          ),
        "ERC1155Pausable: token transfer while paused"
      );
    });

    it("reverts when trying to mint", async function () {
      await expectRevert(
        this.token.mint(holder.address, secondTokenId, secondTokenAmount, "0x"),
        "ERC1155Pausable: token transfer while paused"
      );
    });

    it("reverts when trying to mintBatch", async function () {
      await expectRevert(
        this.token.mintBatch(
          holder.address,
          [secondTokenId],
          [secondTokenAmount],
          "0x"
        ),
        "ERC1155Pausable: token transfer while paused"
      );
    });

    it("reverts when trying to burn", async function () {
      await expectRevert(
        this.token.burn(holder.address, firstTokenId, firstTokenAmount),
        "ERC1155Pausable: token transfer while paused"
      );
    });

    it("reverts when trying to burnBatch", async function () {
      await expectRevert(
        this.token.burnBatch(
          holder.address,
          [firstTokenId],
          [firstTokenAmount]
        ),
        "ERC1155Pausable: token transfer while paused"
      );
    });

    describe("setApprovalForAll", function () {
      it("approves an operator", async function () {
        await this.token.connect(holder).setApprovalForAll(other.address, true);
        expect(
          await this.token.isApprovedForAll(holder.address, other.address)
        ).to.equal(true);
      });
    });

    describe("balanceOf", function () {
      it("returns the amount of tokens owned by the given address", async function () {
        const balance = await this.token.balanceOf(
          holder.address,
          firstTokenId
        );
        expect(balance).to.deep.equal(firstTokenAmount);
      });
    });

    describe("isApprovedForAll", function () {
      it("returns the approval of the operator", async function () {
        expect(
          await this.token.isApprovedForAll(holder.address, operator.address)
        ).to.equal(true);
      });
    });
  });
});
