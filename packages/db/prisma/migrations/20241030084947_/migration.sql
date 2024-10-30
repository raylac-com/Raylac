/*
  Warnings:

  - You are about to drop the column `lastSyncedBlockNum` on the `AddressSyncStatus` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[address]` on the table `ERC5564Announcement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `blockHash` to the `AddressSyncStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blockNumber` to the `AddressSyncStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eRC5564AnnouncementId` to the `AddressSyncStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `ERC5564Announcement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AddressSyncStatus" DROP CONSTRAINT "AddressSyncStatus_address_fkey";

-- DropIndex
DROP INDEX "AddressSyncStatus_address_chainId_tokenId_key";

-- AlterTable
ALTER TABLE "AddressSyncStatus" DROP COLUMN "lastSyncedBlockNum",
ADD COLUMN     "blockHash" TEXT NOT NULL,
ADD COLUMN     "blockNumber" BIGINT NOT NULL,
ADD COLUMN     "eRC5564AnnouncementId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ERC5564Announcement" ADD COLUMN     "address" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ERC5564Announcement_address_key" ON "ERC5564Announcement"("address");

-- AddForeignKey
ALTER TABLE "AddressSyncStatus" ADD CONSTRAINT "AddressSyncStatus_eRC5564AnnouncementId_fkey" FOREIGN KEY ("eRC5564AnnouncementId") REFERENCES "ERC5564Announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
