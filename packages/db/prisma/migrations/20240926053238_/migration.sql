/*
  Warnings:

  - You are about to drop the column `inviteCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `InviteCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "User_inviteCode_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "inviteCode";

-- DropTable
DROP TABLE "InviteCode";

-- CreateTable
CREATE TABLE "TraceSyncStatus" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "lastSyncedBlockNum" BIGINT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TraceSyncStatus_pkey" PRIMARY KEY ("id")
);
