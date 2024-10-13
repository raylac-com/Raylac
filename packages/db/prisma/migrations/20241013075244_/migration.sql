/*
  Warnings:

  - You are about to drop the column `fromUserId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_toUserId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "fromUserId",
DROP COLUMN "toUserId";

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_from_fkey" FOREIGN KEY ("from") REFERENCES "UserStealthAddress"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_to_fkey" FOREIGN KEY ("to") REFERENCES "UserStealthAddress"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
