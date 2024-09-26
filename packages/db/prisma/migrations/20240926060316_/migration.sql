/*
  Warnings:

  - A unique constraint covering the columns `[address,chainId]` on the table `TraceSyncStatus` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TraceSyncStatus_address_chainId_key" ON "TraceSyncStatus"("address", "chainId");
