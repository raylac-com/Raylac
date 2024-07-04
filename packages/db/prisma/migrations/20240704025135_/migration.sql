/*
  Warnings:

  - You are about to drop the column `userOpHashes` on the `StealthTransfer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StealthTransfer" DROP COLUMN "userOpHashes";

-- CreateTable
CREATE TABLE "UserOperationReceipt" (
    "hash" TEXT NOT NULL,
    "nonce" BIGINT,
    "success" BOOLEAN,
    "actualGasUsed" BIGINT,
    "actualGasCost" BIGINT,
    "blockNumber" BIGINT,
    "logIndex" INTEGER,
    "txIndex" INTEGER,
    "chainId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stealthTransferId" INTEGER,

    CONSTRAINT "UserOperationReceipt_pkey" PRIMARY KEY ("hash")
);

-- AddForeignKey
ALTER TABLE "UserOperationReceipt" ADD CONSTRAINT "UserOperationReceipt_stealthTransferId_fkey" FOREIGN KEY ("stealthTransferId") REFERENCES "StealthTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
