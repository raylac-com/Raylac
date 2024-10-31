/*
  Warnings:

  - You are about to drop the `Upgraded` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Upgraded" DROP CONSTRAINT "Upgraded_address_fkey";

-- DropForeignKey
ALTER TABLE "Upgraded" DROP CONSTRAINT "Upgraded_txHash_fkey";

-- DropTable
DROP TABLE "Upgraded";
