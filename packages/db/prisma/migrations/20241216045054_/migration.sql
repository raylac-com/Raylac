/*
  Warnings:

  - You are about to drop the column `receiveId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `sendId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Receive` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Send` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_receiveId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_sendId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "receiveId",
DROP COLUMN "sendId";

-- DropTable
DROP TABLE "Receive";

-- DropTable
DROP TABLE "Send";

-- CreateTable
CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "txHash" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "destinationChainId" INTEGER NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bridge" (
    "id" TEXT NOT NULL,
    "fromChainId" INTEGER NOT NULL,
    "toChainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "amountIn" DECIMAL(65,30) NOT NULL,
    "amountOut" DECIMAL(65,30) NOT NULL,
    "bridgeFeeAmount" DECIMAL(65,30) NOT NULL,
    "bridgeFeeUsd" DECIMAL(65,30) NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transferId" INTEGER,

    CONSTRAINT "Bridge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_txHash_key" ON "Transfer"("txHash");

-- AddForeignKey
ALTER TABLE "Bridge" ADD CONSTRAINT "Bridge_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
