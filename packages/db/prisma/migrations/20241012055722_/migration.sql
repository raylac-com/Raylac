/*
  Warnings:

  - A unique constraint covering the columns `[transactionHash,logIndex]` on the table `Trace` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionHash,traceAddress]` on the table `Trace` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Trace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trace" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Trace_transactionHash_logIndex_key" ON "Trace"("transactionHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Trace_transactionHash_traceAddress_key" ON "Trace"("transactionHash", "traceAddress");
