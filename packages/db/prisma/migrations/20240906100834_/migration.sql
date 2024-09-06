/*
  Warnings:

  - You are about to drop the `Transfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserOperationReceipt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "UserOperationReceipt" DROP CONSTRAINT "UserOperationReceipt_transferId_fkey";

-- DropTable
DROP TABLE "Transfer";

-- DropTable
DROP TABLE "UserOperationReceipt";

-- CreateTable
CREATE TABLE "ERC20Token" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ERC20Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StealthTransfer" (
    "id" SERIAL NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txIndex" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StealthTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ERC20TransferLog" (
    "id" SERIAL NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txIndex" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ERC20TransferLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StealthTransfer_blockNumber_logIndex_txIndex_chainId_key" ON "StealthTransfer"("blockNumber", "logIndex", "txIndex", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "ERC20TransferLog_blockNumber_logIndex_txIndex_chainId_key" ON "ERC20TransferLog"("blockNumber", "logIndex", "txIndex", "chainId");

-- AddForeignKey
ALTER TABLE "StealthTransfer" ADD CONSTRAINT "StealthTransfer_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "ERC20Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ERC20TransferLog" ADD CONSTRAINT "ERC20TransferLog_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "ERC20Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
