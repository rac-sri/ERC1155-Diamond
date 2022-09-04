const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = constants;

const { expect } = require("chai");
const { ethers } = require("hardhat");

const { shouldSupportInterfaces } = require("./SupportsInterface.behavior");

let ERC1155Mock;
let ERC1155ReceiverMock;

function shouldBehaveLikeERC1155(
  minter,
  multiTokenHolder,
  proxy,
  [firstTokenHolder, secondTokenHolder, recipient]
) {
  const firstTokenId = ethers.BigNumber.from(1);
  const secondTokenId = ethers.BigNumber.from(2);
  const unknownTokenId = ethers.BigNumber.from(3);

  const firstAmount = ethers.BigNumber.from(1000);
  const secondAmount = ethers.BigNumber.from(2000);

  const RECEIVER_SINGLE_MAGIC_VALUE = "0xf23a6e61";
  const RECEIVER_BATCH_MAGIC_VALUE = "0xbc197c81";

  describe("like an ERC1155", function () {
    beforeEach(async () => {
      ERC1155Mock = await ethers.getContractFactory("ERC1155Mock");
      ERC1155ReceiverMock = await ethers.getContractFactory(
        "ERC1155ReceiverMock"
      );
      ERC1155Mock = await ERC1155Mock.deploy();
      ERC1155ReceiverMock = await ERC1155ReceiverMock.deploy();
    });
    describe("balanceOf", function () {
      it("reverts when queried about the zero address", async function () {
        await expect(
          ERC1155Mock.balanceOf(ZERO_ADDRESS, firstTokenId)
        ).to.be.rejectedWith("ERC1155: address zero is not a valid owner");
      });

      context("when accounts don't own tokens", function () {
        it("returns zero for given addresses", async function () {
          expect(
            await ERC1155Mock.balanceOf(firstTokenHolder, firstTokenId)
          ).to.equal("0");

          expect(
            await ERC1155Mock.balanceOf(secondTokenHolder, secondTokenId)
          ).to.equal("0");

          expect(
            await ERC1155Mock.balanceOf(firstTokenHolder, unknownTokenId)
          ).to.equal("0");
        });
      });

      context("when accounts own some tokens", function () {
        beforeEach(async function () {
          await ERC1155Mock.connect(minter).mint(
            firstTokenHolder,
            firstTokenId,
            firstAmount,
            "0x"
          );
          await ERC1155Mock.connect(minter).mint(
            secondTokenHolder,
            secondTokenId,
            secondAmount,
            "0x"
          );
        });

        it("returns the amount of tokens owned by the given addresses", async function () {
          expect(
            await ERC1155Mock.balanceOf(firstTokenHolder, firstTokenId)
          ).to.equal(firstAmount);

          expect(
            await ERC1155Mock.balanceOf(secondTokenHolder, secondTokenId)
          ).to.equal(secondAmount);

          expect(
            await ERC1155Mock.balanceOf(firstTokenHolder, unknownTokenId)
          ).to.equal("0");
        });
      });
    });

    describe("balanceOfBatch", function () {
      it("reverts when input arrays don't match up", async function () {
        await expectRevert(
          ERC1155Mock.balanceOfBatch(
            [
              firstTokenHolder,
              secondTokenHolder,
              firstTokenHolder,
              secondTokenHolder,
            ],
            [firstTokenId, secondTokenId, unknownTokenId]
          ),
          "ERC1155: accounts and ids length mismatch"
        );

        await expectRevert(
          ERC1155Mock.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder],
            [firstTokenId, secondTokenId, unknownTokenId]
          ),
          "ERC1155: accounts and ids length mismatch"
        );
      });

      it("reverts when one of the addresses is the zero address", async function () {
        await expectRevert(
          ERC1155Mock.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder, ZERO_ADDRESS],
            [firstTokenId, secondTokenId, unknownTokenId]
          ),
          "ERC1155: address zero is not a valid owner"
        );
      });

      context("when accounts don't own tokens", function () {
        it("returns zeros for each account", async function () {
          const result = await ERC1155Mock.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder, firstTokenHolder],
            [firstTokenId, secondTokenId, unknownTokenId]
          );
          expect(result).to.be.an("array");
          expect(result[0]).to.be.equal("0");
          expect(result[1]).to.be.equal("0");
          expect(result[2]).to.be.equal("0");
        });
      });

      context("when accounts own some tokens", function () {
        beforeEach(async function () {
          await ERC1155Mock.connect(minter).mint(
            firstTokenHolder,
            firstTokenId,
            firstAmount,
            "0x"
          );
          await ERC1155Mock.connect(minter).mint(
            secondTokenHolder,
            secondTokenId,
            secondAmount,
            "0x"
          );
        });

        it("returns amounts owned by each account in order passed", async function () {
          const result = await ERC1155Mock.balanceOfBatch(
            [secondTokenHolder, firstTokenHolder, firstTokenHolder],
            [secondTokenId, firstTokenId, unknownTokenId]
          );
          expect(result).to.be.an("array");
          expect(result[0]).to.be.equal(secondAmount);
          expect(result[1]).to.be.equal(firstAmount);
          expect(result[2]).to.be.equal("0");
        });

        it("returns multiple times the balance of the same address when asked", async function () {
          const result = await ERC1155Mock.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder, firstTokenHolder],
            [firstTokenId, secondTokenId, firstTokenId]
          );
          expect(result).to.be.an("array");
          expect(result[0]).to.be.equal(result[2]);
          expect(result[0]).to.be.equal(firstAmount);
          expect(result[1]).to.be.equal(secondAmount);
          expect(result[2]).to.be.equal(firstAmount);
        });
      });
    });

    describe("setApprovalForAll", function () {
      let receipt;
      beforeEach(async function () {
        receipt = await ERC1155Mock.connect(multiTokenHolder).setApprovalForAll(
          proxy.address,
          true
        );
      });

      it("sets approval status which can be queried via isApprovedForAll", async function () {
        expect(
          await ERC1155Mock.isApprovedForAll(
            multiTokenHolder.address,
            proxy.address
          )
        ).to.be.equal(true);
      });

      it("emits an ApprovalForAll log", function () {
        expect(receipt)
          .to.emit("ApprovalForAll")
          .withArgs(multiTokenHolder.address, proxy.address, true);
      });

      it("can unset approval for an operator", async function () {
        await ERC1155Mock.connect(multiTokenHolder).setApprovalForAll(
          proxy.address,
          false
        );
        expect(
          await ERC1155Mock.isApprovedForAll(
            multiTokenHolder.address,
            proxy.address
          )
        ).to.be.equal(false);
      });

      it("reverts if attempting to approve self as an operator", async function () {
        await expectRevert(
          ERC1155Mock.connect(multiTokenHolder).setApprovalForAll(
            multiTokenHolder.address,
            true
          ),
          "ERC1155: setting approval status for self"
        );
      });
    });

    describe("safeTransferFrom", function () {
      beforeEach(async function () {
        await ERC1155Mock.connect(minter).mint(
          multiTokenHolder.address,
          firstTokenId,
          firstAmount,
          "0x"
        );
        await ERC1155Mock.connect(minter).mint(
          multiTokenHolder.address,
          secondTokenId,
          secondAmount,
          "0x"
        );
      });

      it("reverts when transferring more than balance", async function () {
        await expectRevert(
          ERC1155Mock.connect(multiTokenHolder).safeTransferFrom(
            multiTokenHolder.address,
            recipient,
            firstTokenId,
            firstAmount.add(1),
            "0x"
          ),
          "ERC1155: insufficient balance for transfer"
        );
      });

      it("reverts when transferring to zero address", async function () {
        await expectRevert(
          ERC1155Mock.connect(multiTokenHolder).safeTransferFrom(
            multiTokenHolder.address,
            ZERO_ADDRESS,
            firstTokenId,
            firstAmount,
            "0x"
          ),
          "ERC1155: transfer to the zero address"
        );
      });

      function transferWasSuccessful({ operator, from, id, value }) {
        it("debits transferred balance from sender", async function () {
          const newBalance = await ERC1155Mock.balanceOf(from.address, id);
          expect(newBalance).to.be.equal("0");
        });

        it("credits transferred balance to receiver", async function () {
          const newBalance = await ERC1155Mock.balanceOf(this.toWhom, id);
          expect(newBalance).to.be.equal(value);
        });

        it("emits a TransferSingle log", function () {
          expect(this.transferLogs)
            .to.emit("TransferSingle")
            .withArgs(operator.address, from.address, this.toWhom, id, value);
        });
      }

      context("when called by the multiTokenHolder", async function () {
        beforeEach(async function () {
          this.toWhom = recipient;
          this.transferLogs = await ERC1155Mock.connect(
            multiTokenHolder
          ).safeTransferFrom(
            multiTokenHolder.address,
            recipient,
            firstTokenId,
            firstAmount,
            "0x"
          );
        });

        transferWasSuccessful.call(this, {
          operator: multiTokenHolder,
          from: multiTokenHolder,
          id: firstTokenId,
          value: firstAmount,
        });

        it("preserves existing balances which are not transferred by multiTokenHolder", async function () {
          const balance1 = await ERC1155Mock.balanceOf(
            multiTokenHolder.address,
            secondTokenId
          );
          expect(balance1).to.be.equal(secondAmount);

          const balance2 = await ERC1155Mock.balanceOf(
            recipient,
            secondTokenId
          );
          expect(balance2).to.be.equal("0");
        });
      });

      context(
        "when called by an operator on behalf of the multiTokenHolder",
        function () {
          context(
            "when operator is not approved by multiTokenHolder",
            function () {
              beforeEach(async function () {
                await ERC1155Mock.connect(multiTokenHolder).setApprovalForAll(
                  proxy.address,
                  false
                );
              });

              it("reverts", async function () {
                await expectRevert(
                  ERC1155Mock.connect(proxy).safeTransferFrom(
                    multiTokenHolder.address,
                    recipient,
                    firstTokenId,
                    firstAmount,
                    "0x"
                  ),
                  "ERC1155: caller is not token owner or approved"
                );
              });
            }
          );

          context("when operator is approved by multiTokenHolder", function () {
            beforeEach(async function () {
              this.toWhom = recipient;
              await ERC1155Mock.connect(multiTokenHolder).setApprovalForAll(
                proxy.address,
                true
              );
              this.transferLogs = await ERC1155Mock.connect(
                proxy
              ).safeTransferFrom(
                multiTokenHolder.address,
                recipient,
                firstTokenId,
                firstAmount,
                "0x"
              );
            });

            transferWasSuccessful.call(this, {
              operator: proxy,
              from: multiTokenHolder,
              id: firstTokenId,
              value: firstAmount,
            });

            it("preserves operator's balances not involved in the transfer", async function () {
              const balance1 = await ERC1155Mock.balanceOf(
                proxy.address,
                firstTokenId
              );
              expect(balance1).to.be.equal("0");

              const balance2 = await ERC1155Mock.balanceOf(
                proxy.address,
                secondTokenId
              );
              expect(balance2).to.be.equal("0");
            });
          });
        }
      );

      context("when sending to a valid receiver", function () {
        beforeEach(async function () {
          await ERC1155ReceiverMock.initialize(
            RECEIVER_SINGLE_MAGIC_VALUE,
            false,
            RECEIVER_BATCH_MAGIC_VALUE,
            false
          );
        });

        context("without data", function () {
          beforeEach(async function () {
            this.toWhom = ERC1155ReceiverMock.address;
            this.transferReceipt = await ERC1155Mock.connect(
              multiTokenHolder
            ).safeTransferFrom(
              multiTokenHolder.address,
              ERC1155ReceiverMock.address,
              firstTokenId,
              firstAmount,
              "0x"
            );
            this.transferLogs = this.transferReceipt;
          });

          transferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstAmount,
          });

          it("calls onERC1155Received", async function () {
            expect(this.transferReceipt)
              .to.emit("Received")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                firstTokenId,
                firstAmount,
                null
              );
          });
        });

        context("with data", function () {
          const data = "0xf00dd00d";
          beforeEach(async function () {
            this.toWhom = ERC1155ReceiverMock.address;
            this.transferReceipt = await ERC1155Mock.connect(
              multiTokenHolder
            ).safeTransferFrom(
              multiTokenHolder.address,
              ERC1155ReceiverMock.address,
              firstTokenId,
              firstAmount,
              data
            );
            this.transferLogs = this.transferReceipt;
          });

          transferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstAmount,
          });

          it("calls onERC1155Received", async function () {
            expect(this.transferReceipt)
              .to.emit("Received")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                firstTokenId,
                firstAmount,
                data
              );
          });
        });
      });

      context("to a receiver contract returning unexpected value", function () {
        beforeEach(async function () {
          await ERC1155ReceiverMock.initialize(
            "0x00c0ffee",
            false,
            RECEIVER_BATCH_MAGIC_VALUE,
            false
          );
        });

        it("reverts", async function () {
          await expectRevert(
            ERC1155Mock.connect(multiTokenHolder).safeTransferFrom(
              multiTokenHolder.address,
              ERC1155ReceiverMock.address,
              firstTokenId,
              firstAmount,
              "0x"
            ),
            "ERC1155: ERC1155Receiver rejected tokens"
          );
        });
      });

      context("to a receiver contract that reverts", function () {
        beforeEach(async function () {
          await ERC1155ReceiverMock.initialize(
            RECEIVER_SINGLE_MAGIC_VALUE,
            true,
            RECEIVER_BATCH_MAGIC_VALUE,
            false
          );
        });

        it("reverts", async function () {
          await expectRevert(
            ERC1155Mock.connect(multiTokenHolder).safeTransferFrom(
              multiTokenHolder.address,
              ERC1155ReceiverMock.address,
              firstTokenId,
              firstAmount,
              "0x"
            ),
            "ERC1155ReceiverMock: reverting on receive"
          );
        });
      });

      context(
        "to a contract that does not implement the required function",
        function () {
          it("reverts", async function () {
            const invalidReceiver = ERC1155Mock;

            await expectRevert.unspecified(
              ERC1155Mock.connect(multiTokenHolder).safeTransferFrom(
                multiTokenHolder.address,
                invalidReceiver.address,
                firstTokenId,
                firstAmount,
                "0x"
              )
            );
          });
        }
      );
    });

    describe("safeBatchTransferFrom", function () {
      beforeEach(async function () {
        await ERC1155Mock.connect(minter).mint(
          multiTokenHolder.address,
          firstTokenId,
          firstAmount,
          "0x"
        );
        await ERC1155Mock.connect(minter).mint(
          multiTokenHolder.address,
          secondTokenId,
          secondAmount,
          "0x"
        );
      });

      it("reverts when transferring amount more than any of balances", async function () {
        await expectRevert(
          ERC1155Mock.connect(multiTokenHolder).safeBatchTransferFrom(
            multiTokenHolder.address,
            recipient,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount.add(1)],
            "0x"
          ),
          "ERC1155: insufficient balance for transfer"
        );
      });

      it("reverts when ids array length doesn't match amounts array length", async function () {
        await expectRevert(
          ERC1155Mock.connect(multiTokenHolder).safeBatchTransferFrom(
            multiTokenHolder.address,
            recipient,
            [firstTokenId],
            [firstAmount, secondAmount],
            "0x"
          ),
          "ERC1155: ids and amounts length mismatch"
        );

        await expectRevert(
          ERC1155Mock.connect(multiTokenHolder).safeBatchTransferFrom(
            multiTokenHolder.address,
            recipient,
            [firstTokenId, secondTokenId],
            [firstAmount],
            "0x"
          ),
          "ERC1155: ids and amounts length mismatch"
        );
      });

      it("reverts when transferring to zero address", async function () {
        await expectRevert(
          ERC1155Mock.connect(multiTokenHolder).safeBatchTransferFrom(
            multiTokenHolder.address,
            ZERO_ADDRESS,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount],
            "0x"
          ),
          "ERC1155: transfer to the zero address"
        );
      });

      function batchTransferWasSuccessful({ operator, from, ids, values }) {
        it("debits transferred balances from sender", async function () {
          const newBalances = await ERC1155Mock.balanceOfBatch(
            new Array(ids.length).fill(from.address),
            ids
          );
          for (const newBalance of newBalances) {
            expect(newBalance).to.be.equal("0");
          }
        });

        it("credits transferred balances to receiver", async function () {
          const newBalances = await ERC1155Mock.balanceOfBatch(
            new Array(ids.length).fill(this.toWhom),
            ids
          );
          for (let i = 0; i < newBalances.length; i++) {
            expect(newBalances[i]).to.be.equal(values[i]);
          }
        });

        it("emits a TransferBatch log", function () {
          expect(this.transferLogs)
            .to.emit("TransferBatch")
            .withArgs(operator.address, from.address, this.toWhom);
        });
      }

      context("when called by the multiTokenHolder", async function () {
        beforeEach(async function () {
          this.toWhom = recipient;
          this.transferLogs = await ERC1155Mock.connect(
            multiTokenHolder
          ).safeBatchTransferFrom(
            multiTokenHolder.address,
            recipient,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount],
            "0x"
          );
        });

        batchTransferWasSuccessful.call(this, {
          operator: multiTokenHolder,
          from: multiTokenHolder,
          ids: [firstTokenId, secondTokenId],
          values: [firstAmount, secondAmount],
        });
      });

      context(
        "when called by an operator on behalf of the multiTokenHolder",
        function () {
          context(
            "when operator is not approved by multiTokenHolder",
            function () {
              beforeEach(async function () {
                await ERC1155Mock.connect(multiTokenHolder).setApprovalForAll(
                  proxy.address,
                  false
                );
              });

              it("reverts", async function () {
                await expectRevert(
                  ERC1155Mock.connect(proxy).safeBatchTransferFrom(
                    multiTokenHolder.address,
                    recipient,
                    [firstTokenId, secondTokenId],
                    [firstAmount, secondAmount],
                    "0x"
                  ),
                  "ERC1155: caller is not token owner or approved"
                );
              });
            }
          );

          context("when operator is approved by multiTokenHolder", function () {
            beforeEach(async function () {
              this.toWhom = recipient;
              await ERC1155Mock.connect(multiTokenHolder).setApprovalForAll(
                proxy.address,
                true
              );
              this.transferLogs = await ERC1155Mock.connect(
                proxy
              ).safeBatchTransferFrom(
                multiTokenHolder.address,
                recipient,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                "0x"
              );
            });

            batchTransferWasSuccessful.call(this, {
              operator: proxy,
              from: multiTokenHolder,
              ids: [firstTokenId, secondTokenId],
              values: [firstAmount, secondAmount],
            });

            it("preserves operator's balances not involved in the transfer", async function () {
              const balance1 = await ERC1155Mock.balanceOf(
                proxy.address,
                firstTokenId
              );
              expect(balance1).to.be.equal("0");
              const balance2 = await ERC1155Mock.balanceOf(
                proxy.address,
                secondTokenId
              );
              expect(balance2).to.be.equal("0");
            });
          });
        }
      );

      context("when sending to a valid receiver", function () {
        beforeEach(async function () {
          await ERC1155ReceiverMock.initialize(
            RECEIVER_SINGLE_MAGIC_VALUE,
            false,
            RECEIVER_BATCH_MAGIC_VALUE,
            false
          );
        });

        context("without data", function () {
          beforeEach(async function () {
            this.toWhom = ERC1155ReceiverMock.address;
            this.transferReceipt = await ERC1155Mock.connect(
              multiTokenHolder
            ).safeBatchTransferFrom(
              multiTokenHolder.address,
              ERC1155ReceiverMock.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              "0x"
            );
            this.transferLogs = this.transferReceipt;
          });

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it("calls onERC1155BatchReceived", async function () {
            expect(this.transferReceipt)
              .to.emit("BatchReceived")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                null
              );
          });
        });

        context("with data", function () {
          const data = "0xf00dd00d";
          beforeEach(async function () {
            this.toWhom = ERC1155ReceiverMock.address;
            this.transferReceipt = await ERC1155Mock.connect(
              multiTokenHolder
            ).safeBatchTransferFrom(
              multiTokenHolder.address,
              ERC1155ReceiverMock.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              data
            );
            this.transferLogs = this.transferReceipt;
          });

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it("calls onERC1155Received", async function () {
            expect(this.transferReceipt)
              .to.emit("BatchReceived")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                null
              );
          });
        });
      });

      context("to a receiver contract returning unexpected value", function () {
        beforeEach(async function () {
          await ERC1155ReceiverMock.initialize(
            RECEIVER_SINGLE_MAGIC_VALUE,
            false,
            RECEIVER_SINGLE_MAGIC_VALUE,
            false
          );
        });

        it("reverts", async function () {
          await expectRevert(
            ERC1155Mock.connect(multiTokenHolder).safeBatchTransferFrom(
              multiTokenHolder.address,
              ERC1155ReceiverMock.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              "0x"
            ),
            "ERC1155: ERC1155Receiver rejected tokens"
          );
        });
      });

      context("to a receiver contract that reverts", function () {
        beforeEach(async function () {
          await ERC1155ReceiverMock.initialize(
            RECEIVER_SINGLE_MAGIC_VALUE,
            false,
            RECEIVER_BATCH_MAGIC_VALUE,
            true
          );
        });

        it("reverts", async function () {
          await expectRevert(
            ERC1155Mock.connect(multiTokenHolder).safeBatchTransferFrom(
              multiTokenHolder.address,
              ERC1155ReceiverMock.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              "0x"
            ),
            "ERC1155ReceiverMock: reverting on batch receive"
          );
        });
      });

      context(
        "to a receiver contract that reverts only on single transfers",
        function () {
          beforeEach(async function () {
            await ERC1155ReceiverMock.initialize(
              RECEIVER_SINGLE_MAGIC_VALUE,
              true,
              RECEIVER_BATCH_MAGIC_VALUE,
              false
            );

            this.toWhom = ERC1155ReceiverMock.address;
            this.transferReceipt = await ERC1155Mock.connect(
              multiTokenHolder
            ).safeBatchTransferFrom(
              multiTokenHolder.address,
              ERC1155ReceiverMock.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              "0x"
            );
            this.transferLogs = this.transferReceipt;
          });

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it("calls onERC1155BatchReceived", async function () {
            expect(this.transferReceipt)
              .to.emit("BatchReceived")
              .withArgs(
                multiTokenHolder.address,
                multiTokenHolder.address,
                null
              );
          });
        }
      );

      context(
        "to a contract that does not implement the required function",
        function () {
          it("reverts", async function () {
            const invalidReceiver = ERC1155Mock;
            await expectRevert.unspecified(
              ERC1155Mock.connect(multiTokenHolder).safeBatchTransferFrom(
                multiTokenHolder.address,
                invalidReceiver.address,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                "0x"
              )
            );
          });
        }
      );
    });

    shouldSupportInterfaces(["ERC165", "ERC1155"]);
  });
}

module.exports = {
  shouldBehaveLikeERC1155,
};
