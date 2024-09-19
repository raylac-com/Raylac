/*
  Warnings:

  - You are about to drop the column `stelathTransferId` on the `UserOperationReceipt` table. All the data in the column will be lost.
  - You are about to drop the `ERC20Token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ERC20TransferLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StealthTransfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StelathTransfer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ERC20TransferLog" DROP CONSTRAINT "ERC20TransferLog_stealthTransferId_fkey";

-- DropForeignKey
ALTER TABLE "ERC20TransferLog" DROP CONSTRAINT "ERC20TransferLog_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "StealthTransfer" DROP CONSTRAINT "StealthTransfer_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "UserOperationReceipt" DROP CONSTRAINT "UserOperationReceipt_stelathTransferId_fkey";

-- AlterTable
ALTER TABLE "UserOperationReceipt" DROP COLUMN "stelathTransferId",
ADD COLUMN     "transferId" INTEGER;

-- DropTable
DROP TABLE "ERC20Token";

-- DropTable
DROP TABLE "ERC20TransferLog";

-- DropTable
DROP TABLE "StealthTransfer";

-- DropTable
DROP TABLE "StelathTransfer";

-- CreateTable
CREATE TABLE "IncomingTranfser" (
    "id" SERIAL NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomingTranfser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutgoingTransfer" (
    "id" SERIAL NOT NULL,
    "from" TEXT[],
    "to" TEXT NOT NULL,
    "relayQuotes" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutgoingTransfer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserOperationReceipt" ADD CONSTRAINT "UserOperationReceipt_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "OutgoingTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
