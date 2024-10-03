/*
  Warnings:

  - You are about to drop the column `blockNumber` on the `TransferTrace` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[blockNumber,blockHash,chainId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `blockHash` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "blockHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TransferTrace" DROP COLUMN "blockNumber";

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_blockNumber_blockHash_chainId_key" ON "Transaction"("blockNumber", "blockHash", "chainId");
