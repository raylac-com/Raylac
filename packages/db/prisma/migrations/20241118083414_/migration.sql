/*
  Warnings:

  - You are about to drop the column `tokenPriceAtOp` on the `UserOperation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserOperation" DROP COLUMN "tokenPriceAtOp";
