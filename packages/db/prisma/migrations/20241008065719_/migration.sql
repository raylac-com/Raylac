/*
  Warnings:

  - You are about to drop the column `synchedTraces` on the `Transaction` table. All the data in the column will be lost.
  - The primary key for the `Transfer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `amount` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `executionTag` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `from` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `logIndex` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `to` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `tokenId` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `traceAddress` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `traceId` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `transactionHash` on the `Transfer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_transactionHash_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "synchedTraces";

-- AlterTable
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_pkey",
DROP COLUMN "amount",
DROP COLUMN "executionTag",
DROP COLUMN "from",
DROP COLUMN "logIndex",
DROP COLUMN "to",
DROP COLUMN "tokenId",
DROP COLUMN "traceAddress",
DROP COLUMN "traceId",
DROP COLUMN "transactionHash",
ADD COLUMN     "fromAddress" TEXT,
ADD COLUMN     "fromUserId" INTEGER,
ADD COLUMN     "toAddress" TEXT,
ADD COLUMN     "toUserId" INTEGER,
ADD CONSTRAINT "Transfer_pkey" PRIMARY KEY ("transferId");

-- CreateTable
CREATE TABLE "Trace" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "logIndex" INTEGER,
    "traceAddress" TEXT,

    CONSTRAINT "Trace_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "UserStealthAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "UserStealthAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("transferId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
