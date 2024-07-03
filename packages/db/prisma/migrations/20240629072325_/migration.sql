/*
  Warnings:

  - You are about to drop the column `ephemeralPubKey` on the `UserStealthAddress` table. All the data in the column will be lost.
  - You are about to drop the column `viewTag` on the `UserStealthAddress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserStealthAddress" DROP COLUMN "ephemeralPubKey",
DROP COLUMN "viewTag";

-- CreateTable
CREATE TABLE "ERC5564Announcement" (
    "id" SERIAL NOT NULL,
    "schemeId" INTEGER NOT NULL,
    "stealthAddress" TEXT NOT NULL,
    "caller" TEXT NOT NULL,
    "ephemeralPubKey" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txIndex" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ERC5564Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ERC5564Announcement_blockNumber_logIndex_txIndex_chainId_key" ON "ERC5564Announcement"("blockNumber", "logIndex", "txIndex", "chainId");
