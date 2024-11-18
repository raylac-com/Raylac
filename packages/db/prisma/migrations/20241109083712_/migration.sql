/*
  Warnings:

  - You are about to drop the column `tag` on the `UserOperation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "tag" TEXT;

-- AlterTable
ALTER TABLE "UserOperation" DROP COLUMN "tag";
