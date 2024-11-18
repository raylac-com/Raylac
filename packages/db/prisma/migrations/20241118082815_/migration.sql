/*
  Warnings:

  - You are about to drop the `AddressSyncStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AddressSyncStatus" DROP CONSTRAINT "AddressSyncStatus_eRC5564AnnouncementId_fkey";

-- DropTable
DROP TABLE "AddressSyncStatus";

-- CreateTable
CREATE TABLE "SyncTask" (
    "id" SERIAL NOT NULL,
    "chainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eRC5564AnnouncementId" INTEGER NOT NULL,

    CONSTRAINT "SyncTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncTask_address_chainId_tokenId_key" ON "SyncTask"("address", "chainId", "tokenId");

-- AddForeignKey
ALTER TABLE "SyncTask" ADD CONSTRAINT "SyncTask_eRC5564AnnouncementId_fkey" FOREIGN KEY ("eRC5564AnnouncementId") REFERENCES "ERC5564Announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
