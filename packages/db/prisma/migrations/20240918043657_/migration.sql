/*
  Warnings:

  - Added the required column `chainId` to the `TransferTrace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransferTrace" ADD COLUMN     "chainId" INTEGER NOT NULL;
