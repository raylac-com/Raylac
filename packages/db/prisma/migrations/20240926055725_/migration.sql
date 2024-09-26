/*
  Warnings:

  - You are about to drop the column `lastSyncedBlockNum` on the `UserStealthAddress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[address]` on the table `UserStealthAddress` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserStealthAddress" DROP COLUMN "lastSyncedBlockNum";

-- CreateIndex
CREATE UNIQUE INDEX "UserStealthAddress_address_key" ON "UserStealthAddress"("address");
