/*
  Warnings:

  - You are about to drop the `TraceSyncStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "TraceSyncStatus";

-- CreateTable
CREATE TABLE "AddressSyncStatus" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "lastSyncedBlockNum" BIGINT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddressSyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AddressSyncStatus_address_chainId_tokenId_key" ON "AddressSyncStatus"("address", "chainId", "tokenId");
