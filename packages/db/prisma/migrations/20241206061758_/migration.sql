/*
  Warnings:

  - You are about to drop the `AngelRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Block` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ERC5564Announcement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncTask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Trace` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserAction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserOperation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserStealthAddress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AngelRequest" DROP CONSTRAINT "AngelRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "SyncTask" DROP CONSTRAINT "SyncTask_eRC5564AnnouncementId_fkey";

-- DropForeignKey
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_fromStealthAddress_fkey";

-- DropForeignKey
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_toStealthAddress_fkey";

-- DropForeignKey
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_transactionHash_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_blockHash_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userActionId_fkey";

-- DropForeignKey
ALTER TABLE "UserAction" DROP CONSTRAINT "UserAction_paidAngelRequestId_fkey";

-- DropForeignKey
ALTER TABLE "UserOperation" DROP CONSTRAINT "UserOperation_sender_fkey";

-- DropForeignKey
ALTER TABLE "UserOperation" DROP CONSTRAINT "UserOperation_transactionHash_fkey";

-- DropForeignKey
ALTER TABLE "UserStealthAddress" DROP CONSTRAINT "UserStealthAddress_userId_fkey";

-- DropTable
DROP TABLE "AngelRequest";

-- DropTable
DROP TABLE "Block";

-- DropTable
DROP TABLE "ERC5564Announcement";

-- DropTable
DROP TABLE "SyncStatus";

-- DropTable
DROP TABLE "SyncTask";

-- DropTable
DROP TABLE "Trace";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserAction";

-- DropTable
DROP TABLE "UserOperation";

-- DropTable
DROP TABLE "UserStealthAddress";

-- DropEnum
DROP TYPE "SyncJob";

-- CreateTable
CREATE TABLE "Swap" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "tokenAddressIn" TEXT NOT NULL,
    "tokenAddressOut" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amountIn" TEXT NOT NULL,
    "amountOut" TEXT NOT NULL,
    "usdAmountIn" TEXT NOT NULL,
    "usdAmountOut" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Swap_pkey" PRIMARY KEY ("id")
);
