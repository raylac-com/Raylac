/*
  Warnings:

  - Added the required column `tokenId` to the `IncomingTransfer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IncomingTransfer" ADD COLUMN     "tokenId" TEXT NOT NULL;
