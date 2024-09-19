/*
  Warnings:

  - You are about to drop the column `txHash` on the `UserOperation` table. All the data in the column will be lost.
  - Added the required column `chainId` to the `UserOperation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserOperation" DROP COLUMN "txHash",
ADD COLUMN     "actualGasCost" BIGINT,
ADD COLUMN     "actualGasUsed" BIGINT,
ADD COLUMN     "chainId" INTEGER NOT NULL,
ADD COLUMN     "nonce" BIGINT,
ADD COLUMN     "paymaster" TEXT,
ADD COLUMN     "sender" TEXT,
ADD COLUMN     "success" BOOLEAN;
