/*
  Warnings:

  - You are about to drop the column `amount` on the `StealthTransfer` table. All the data in the column will be lost.
  - You are about to drop the column `blockNumber` on the `StealthTransfer` table. All the data in the column will be lost.
  - You are about to drop the column `chainId` on the `StealthTransfer` table. All the data in the column will be lost.
  - You are about to drop the column `logIndex` on the `StealthTransfer` table. All the data in the column will be lost.
  - You are about to drop the column `txIndex` on the `StealthTransfer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[txHash]` on the table `StealthTransfer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stealthTransferId` to the `ERC20TransferLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `txHash` to the `StealthTransfer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "StealthTransfer_blockNumber_logIndex_txIndex_chainId_key";

-- AlterTable
ALTER TABLE "ERC20TransferLog" ADD COLUMN     "stealthTransferId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StealthTransfer" DROP COLUMN "amount",
DROP COLUMN "blockNumber",
DROP COLUMN "chainId",
DROP COLUMN "logIndex",
DROP COLUMN "txIndex",
ADD COLUMN     "txHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StealthTransfer_txHash_key" ON "StealthTransfer"("txHash");

-- AddForeignKey
ALTER TABLE "ERC20TransferLog" ADD CONSTRAINT "ERC20TransferLog_stealthTransferId_fkey" FOREIGN KEY ("stealthTransferId") REFERENCES "StealthTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
