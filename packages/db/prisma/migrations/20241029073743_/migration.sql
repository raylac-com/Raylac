/*
  Warnings:

  - You are about to drop the column `from` on the `NativeTransferTrace` table. All the data in the column will be lost.
  - Changed the type of `to` on the `NativeTransferTrace` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "NativeTransferTrace" DROP COLUMN "from",
DROP COLUMN "to",
ADD COLUMN     "to" BYTEA NOT NULL;
