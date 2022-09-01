const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = constants;

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const { shouldBehaveLikeERC1155 } = require("./ERC1155.behavior");

describe("ERC1155", () => {
  let ERC1155Mock;
  let accounts = [];
  let operator, tokenHolder, tokenBatchHolder, otherAccounts;

  const initialURI = "https://token-cdn-domain/{id}.json";

  beforeEach(async function () {
    ERC1155Mock = await ethers.getContractFactory("ERC1155Mock");
    const accountSigners = await ethers.getSigners();

    for (let i = 0; i < accountSigners.length; ++i) {
      accounts.push(await accountSigners[i].getAddress());
    }

    [operator, tokenHolder, tokenBatchHolder, ...otherAccounts] = accounts;

    ERC1155Mock = await ERC1155Mock.deploy();

    await ERC1155Mock.setURI(initialURI);
  });

  it("should behave like erc 1155", () => {
    shouldBehaveLikeERC1155(otherAccounts);
  });

  describe("internal functions", function () {
    const tokenId = BigNumber.from(1990);
    const mintAmount = BigNumber.from(9001);
    const burnAmount = BigNumber.from(3000);

    const tokenBatchIds = [
      BigNumber.from(2000),
      BigNumber.from(2010),
      BigNumber.from(2020),
    ];
    const mintAmounts = [
      BigNumber.from(5000),
      BigNumber.from(10000),
      BigNumber.from(42195),
    ];
    const burnAmounts = [
      BigNumber.from(5000),
      BigNumber.from(9001),
      BigNumber.from(195),
    ];

    const data = "0x12345678";

    describe("_mint", function () {
      it("reverts with a zero destination address", async function () {
        await expect(
          ERC1155Mock.mint(ZERO_ADDRESS, tokenId, mintAmount, data)
        ).to.revertedWith("ERC1155: mint to the zero address");
      });

      describe("with minted tokens", function () {
        beforeEach(async function () {
          this.receipt = await ERC1155Mock.mint(
            tokenHolder,
            tokenId,
            mintAmount,
            data,
            { from: operator }
          );
        });

        it("emits a TransferSingle event", function () {
          expect(this.receipt)
            .to.emit("TransferSingle")
            .withArgs(operator, ZERO_ADDRESS, tokenHolder, tokenId, mintAmount);
        });

        it("credits the minted amount of tokens", async function () {
          console.log(
            await ERC1155Mock.balanceOf(tokenHolder, tokenId),
            mintAmount
          );
          expect(await ERC1155Mock.balanceOf(tokenHolder, tokenId)).to.equal(
            mintAmount
          );
        });
      });
    });

    describe("_mintBatch", function () {
      it("reverts with a zero destination address", async function () {
        await expectRevert(
          ERC1155Mock.mintBatch(ZERO_ADDRESS, tokenBatchIds, mintAmounts, data),
          "ERC1155: mint to the zero address"
        );
      });

      it("reverts if length of inputs do not match", async function () {
        await expectRevert(
          ERC1155Mock.mintBatch(
            tokenBatchHolder,
            tokenBatchIds,
            mintAmounts.slice(1),
            data
          ),
          "ERC1155: ids and amounts length mismatch"
        );

        await expectRevert(
          ERC1155Mock.mintBatch(
            tokenBatchHolder,
            tokenBatchIds.slice(1),
            mintAmounts,
            data
          ),
          "ERC1155: ids and amounts length mismatch"
        );
      });

      describe("with minted batch of tokens", function () {
        beforeEach(async function () {
          this.receipt = await ERC1155Mock.mintBatch(
            tokenBatchHolder,
            tokenBatchIds,
            mintAmounts,
            data,
            { from: operator }
          );
        });

        it("emits a TransferBatch event", function () {
          expect(this.receipt)
            .to.emit("TransferBatch")
            .withArgs(operator, ZERO_ADDRESS, tokenBatchHolder);
        });

        it("credits the minted batch of tokens", async function () {
          const holderBatchBalances = await ERC1155Mock.balanceOfBatch(
            new Array(tokenBatchIds.length).fill(tokenBatchHolder),
            tokenBatchIds
          );

          for (let i = 0; i < holderBatchBalances.length; i++) {
            expect(holderBatchBalances[i]).to.equal(mintAmounts[i]);
          }
        });
      });
    });

    describe("_burn", function () {
      it("reverts when burning the zero account's tokens", async function () {
        await expectRevert(
          ERC1155Mock.burn(ZERO_ADDRESS, tokenId, mintAmount),
          "ERC1155: burn from the zero address"
        );
      });

      it("reverts when burning a non-existent token id", async function () {
        await expectRevert(
          ERC1155Mock.burn(tokenHolder, tokenId, mintAmount),
          "ERC1155: burn amount exceeds balance"
        );
      });

      it("reverts when burning more than available tokens", async function () {
        await ERC1155Mock.mint(tokenHolder, tokenId, mintAmount, data, {
          from: operator,
        });

        await expectRevert(
          ERC1155Mock.burn(tokenHolder, tokenId, mintAmount.add(1)),
          "ERC1155: burn amount exceeds balance"
        );
      });

      describe("with minted-then-burnt tokens", function () {
        beforeEach(async function () {
          await ERC1155Mock.mint(tokenHolder, tokenId, mintAmount, data);
          this.receipt = await ERC1155Mock.burn(
            tokenHolder,
            tokenId,
            burnAmount,
            { from: operator }
          );
        });

        it("emits a TransferSingle event", function () {
          expect(this.receipt)
            .to.emit("TransferSingle")
            .withArgs(operator, tokenHolder, ZERO_ADDRESS, tokenId, burnAmount);
        });

        it("accounts for both minting and burning", async function () {
          expect(await ERC1155Mock.balanceOf(tokenHolder, tokenId)).to.equal(
            mintAmount.sub(burnAmount)
          );
        });
      });
    });

    describe("_burnBatch", function () {
      it("reverts when burning the zero account's tokens", async function () {
        await expectRevert(
          ERC1155Mock.burnBatch(ZERO_ADDRESS, tokenBatchIds, burnAmounts),
          "ERC1155: burn from the zero address"
        );
      });

      it("reverts if length of inputs do not match", async function () {
        await expectRevert(
          ERC1155Mock.burnBatch(
            tokenBatchHolder,
            tokenBatchIds,
            burnAmounts.slice(1)
          ),
          "ERC1155: ids and amounts length mismatch"
        );

        await expectRevert(
          ERC1155Mock.burnBatch(
            tokenBatchHolder,
            tokenBatchIds.slice(1),
            burnAmounts
          ),
          "ERC1155: ids and amounts length mismatch"
        );
      });

      it("reverts when burning a non-existent token id", async function () {
        await expectRevert(
          ERC1155Mock.burnBatch(tokenBatchHolder, tokenBatchIds, burnAmounts),
          "ERC1155: burn amount exceeds balance"
        );
      });

      describe("with minted-then-burnt tokens", function () {
        beforeEach(async function () {
          await ERC1155Mock.mintBatch(
            tokenBatchHolder,
            tokenBatchIds,
            mintAmounts,
            data
          );
          this.receipt = await ERC1155Mock.burnBatch(
            tokenBatchHolder,
            tokenBatchIds,
            burnAmounts,
            { from: operator }
          );
        });

        it("emits a TransferBatch event", function () {
          expect(this.receipt)
            .to.emit("TransferBatch")
            .withArgs(operator, tokenBatchHolder, ZERO_ADDRESS);
        });

        it("accounts for both minting and burning", async function () {
          const holderBatchBalances = await ERC1155Mock.balanceOfBatch(
            new Array(tokenBatchIds.length).fill(tokenBatchHolder),
            tokenBatchIds
          );

          for (let i = 0; i < holderBatchBalances.length; i++) {
            expect(holderBatchBalances[i]).to.equal(
              mintAmounts[i].sub(burnAmounts[i])
            );
          }
        });
      });
    });
  });

  describe("ERC1155MetadataURI", function () {
    const firstTokenID = BigNumber.from("42");
    const secondTokenID = BigNumber.from("1337");

    it("emits no URI event in constructor", async function () {
      await expectEvent.notEmitted.inConstruction(ERC1155Mock, "URI");
    });

    it("sets the initial URI for all token types", async function () {
      expect(await ERC1155Mock.uri(firstTokenID)).to.be.equal(initialURI);
      expect(await ERC1155Mock.uri(secondTokenID)).to.be.equal(initialURI);
    });

    describe("_setURI", function () {
      const newURI = "https://token-cdn-domain/{locale}/{id}.json";

      it("emits no URI event", async function () {
        const receipt = await ERC1155Mock.setURI(newURI);

        expectEvent.notEmitted(receipt, "URI");
      });

      it("sets the new URI for all token types", async function () {
        await ERC1155Mock.setURI(newURI);

        expect(await ERC1155Mock.uri(firstTokenID)).to.be.equal(newURI);
        expect(await ERC1155Mock.uri(secondTokenID)).to.be.equal(newURI);
      });
    });
  });
});
