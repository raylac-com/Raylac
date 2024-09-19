/*
  Warnings:

  - Added the required column `blockNumber` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chainId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "blockNumber" BIGINT NOT NULL,
ADD COLUMN     "chainId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
