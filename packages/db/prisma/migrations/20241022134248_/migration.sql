-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SyncJob" ADD VALUE 'StealthTransfers';
ALTER TYPE "SyncJob" ADD VALUE 'StealthDeposits';

-- CreateTable
CREATE TABLE "StealthDepositEvent" (
    "id" SERIAL NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "stealthPubKey" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "leafIndex" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StealthDepositEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StealthDepositEvent_txHash_logIndex_chainId_key" ON "StealthDepositEvent"("txHash", "logIndex", "chainId");
