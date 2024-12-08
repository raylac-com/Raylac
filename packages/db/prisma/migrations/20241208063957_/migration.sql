/*
  Warnings:

  - You are about to drop the column `txHash` on the `Swap` table. All the data in the column will be lost.
  - Added the required column `relayerServiceFeeAmount` to the `Swap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relayerServiceFeeChainId` to the `Swap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relayerServiceFeeTokenAddress` to the `Swap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relayerServiceFeeUsd` to the `Swap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Swap" DROP COLUMN "txHash",
ADD COLUMN     "relayerServiceFeeAmount" TEXT NOT NULL,
ADD COLUMN     "relayerServiceFeeChainId" INTEGER NOT NULL,
ADD COLUMN     "relayerServiceFeeTokenAddress" TEXT NOT NULL,
ADD COLUMN     "relayerServiceFeeUsd" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Send" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Send_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receive" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "hash" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "swapId" TEXT,
    "sendId" TEXT,
    "receiveId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "UserOperation" (
    "hash" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "paymaster" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "actualGasCost" BIGINT NOT NULL,
    "actualGasUsed" BIGINT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOperation_pkey" PRIMARY KEY ("hash")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "Swap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sendId_fkey" FOREIGN KEY ("sendId") REFERENCES "Send"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiveId_fkey" FOREIGN KEY ("receiveId") REFERENCES "Receive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOperation" ADD CONSTRAINT "UserOperation_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Transaction"("hash") ON DELETE SET NULL ON UPDATE CASCADE;
