/*
  Warnings:

  - You are about to drop the column `stealthTransferId` on the `UserOperationReceipt` table. All the data in the column will be lost.
  - You are about to drop the `StealthTransfer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StealthTransfer" DROP CONSTRAINT "StealthTransfer_senderId_fkey";

-- DropForeignKey
ALTER TABLE "UserOperationReceipt" DROP CONSTRAINT "UserOperationReceipt_stealthTransferId_fkey";

-- AlterTable
ALTER TABLE "UserOperationReceipt" DROP COLUMN "stealthTransferId",
ADD COLUMN     "transferId" INTEGER;

-- AlterTable
ALTER TABLE "UserStealthAddress" ADD COLUMN     "lastSyncedBlockNum" BIGINT;

-- DropTable
DROP TABLE "StealthTransfer";

-- CreateTable
CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER,
    "toAddress" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOperationReceipt" ADD CONSTRAINT "UserOperationReceipt_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
