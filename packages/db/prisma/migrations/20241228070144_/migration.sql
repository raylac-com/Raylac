/*
  Warnings:

  - You are about to drop the column `relayerServiceFeeChainId` on the `Swap` table. All the data in the column will be lost.
  - You are about to drop the column `relayerServiceFeeTokenAddress` on the `Swap` table. All the data in the column will be lost.
  - You are about to drop the column `usdAmountIn` on the `Swap` table. All the data in the column will be lost.
  - You are about to drop the column `usdAmountOut` on the `Swap` table. All the data in the column will be lost.
  - Added the required column `amountInUsd` to the `Swap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountOutUsd` to the `Swap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Swap" DROP COLUMN "relayerServiceFeeChainId",
DROP COLUMN "relayerServiceFeeTokenAddress",
DROP COLUMN "usdAmountIn",
DROP COLUMN "usdAmountOut",
ADD COLUMN     "amountInUsd" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "amountOutUsd" DECIMAL(65,30) NOT NULL;

-- CreateTable
CREATE TABLE "SwapLineItem" (
    "id" SERIAL NOT NULL,
    "swapId" INTEGER NOT NULL,
    "fromChainId" INTEGER NOT NULL,
    "toChainId" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,

    CONSTRAINT "SwapLineItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SwapLineItem" ADD CONSTRAINT "SwapLineItem_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "Swap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
