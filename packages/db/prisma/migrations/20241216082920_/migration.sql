/*
  Warnings:

  - The primary key for the `Bridge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `transactionHash` on the `Bridge` table. All the data in the column will be lost.
  - The `id` column on the `Bridge` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Swap` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Swap` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `swapId` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `UserOperation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `txHash` to the `Bridge` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `amountIn` on the `Swap` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `amountOut` on the `Swap` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `usdAmountIn` on the `Swap` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `usdAmountOut` on the `Swap` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `relayerServiceFeeAmount` on the `Swap` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `relayerServiceFeeUsd` on the `Swap` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `amountUsd` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenPrice` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_swapId_fkey";

-- DropForeignKey
ALTER TABLE "UserOperation" DROP CONSTRAINT "UserOperation_transactionHash_fkey";

-- AlterTable
ALTER TABLE "Bridge" DROP CONSTRAINT "Bridge_pkey",
DROP COLUMN "transactionHash",
ADD COLUMN     "txHash" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Bridge_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Swap" DROP CONSTRAINT "Swap_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "amountIn",
ADD COLUMN     "amountIn" DECIMAL(65,30) NOT NULL,
DROP COLUMN "amountOut",
ADD COLUMN     "amountOut" DECIMAL(65,30) NOT NULL,
DROP COLUMN "usdAmountIn",
ADD COLUMN     "usdAmountIn" DECIMAL(65,30) NOT NULL,
DROP COLUMN "usdAmountOut",
ADD COLUMN     "usdAmountOut" DECIMAL(65,30) NOT NULL,
DROP COLUMN "relayerServiceFeeAmount",
ADD COLUMN     "relayerServiceFeeAmount" DECIMAL(65,30) NOT NULL,
DROP COLUMN "relayerServiceFeeUsd",
ADD COLUMN     "relayerServiceFeeUsd" DECIMAL(65,30) NOT NULL,
ADD CONSTRAINT "Swap_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "swapId",
ADD COLUMN     "swapId" INTEGER;

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "amountUsd" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "tokenPrice" DECIMAL(65,30) NOT NULL;

-- DropTable
DROP TABLE "UserOperation";

-- CreateTable
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "transferId" INTEGER,
    "swapId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "Swap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "Swap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
