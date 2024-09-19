/*
  Warnings:

  - You are about to drop the `IncomingTransfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OutgoingTransfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserOperationReceipt` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ExecutionType" AS ENUM ('ERC20Transfer', 'ERC20AggregateBridgeTransfer', 'ERC20AggregateTransfer', 'ETHTransfer', 'ETHAggregateTransfer', 'ETHAggregateBridgeTransfer');

-- DropForeignKey
ALTER TABLE "UserOperationReceipt" DROP CONSTRAINT "UserOperationReceipt_transferId_fkey";

-- DropTable
DROP TABLE "IncomingTransfer";

-- DropTable
DROP TABLE "OutgoingTransfer";

-- DropTable
DROP TABLE "UserOperationReceipt";

-- CreateTable
CREATE TABLE "TransferTrace" (
    "id" SERIAL NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "txPosition" INTEGER NOT NULL,
    "executionType" "ExecutionType" NOT NULL,
    "executionTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "hash" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "UserOperation" (
    "hash" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "transactionHash" TEXT,

    CONSTRAINT "UserOperation_pkey" PRIMARY KEY ("hash")
);

-- AddForeignKey
ALTER TABLE "TransferTrace" ADD CONSTRAINT "TransferTrace_txHash_fkey" FOREIGN KEY ("txHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOperation" ADD CONSTRAINT "UserOperation_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Transaction"("hash") ON DELETE SET NULL ON UPDATE CASCADE;
