/*
  Warnings:

  - You are about to drop the `RelayIntent` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "UserOperationReceipt" ADD COLUMN     "stelathTransferId" INTEGER;

-- DropTable
DROP TABLE "RelayIntent";

-- DropEnum
DROP TYPE "RelayExecutionStatus";

-- CreateTable
CREATE TABLE "StelathTransfer" (
    "id" SERIAL NOT NULL,
    "from" TEXT[],
    "to" TEXT NOT NULL,
    "relayQuotes" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StelathTransfer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserOperationReceipt" ADD CONSTRAINT "UserOperationReceipt_stelathTransferId_fkey" FOREIGN KEY ("stelathTransferId") REFERENCES "StelathTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
