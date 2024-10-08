/*
  Warnings:

  - You are about to drop the `ERC20TransferLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransferTrace` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ERC20TransferLog" DROP CONSTRAINT "ERC20TransferLog_transactionHash_fkey";

-- DropForeignKey
ALTER TABLE "TransferTrace" DROP CONSTRAINT "TransferTrace_txHash_fkey";

-- DropTable
DROP TABLE "ERC20TransferLog";

-- DropTable
DROP TABLE "TransferTrace";

-- DropEnum
DROP TYPE "ExecutionType";

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "executionTag" TEXT,
    "transactionHash" TEXT NOT NULL,
    "logIndex" INTEGER,
    "traceAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddressSyncStatus" ADD CONSTRAINT "AddressSyncStatus_address_fkey" FOREIGN KEY ("address") REFERENCES "UserStealthAddress"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
