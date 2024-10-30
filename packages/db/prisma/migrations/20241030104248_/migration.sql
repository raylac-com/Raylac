/*
  Warnings:

  - A unique constraint covering the columns `[address,chainId,tokenId]` on the table `AddressSyncStatus` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AddressSyncStatus_address_chainId_tokenId_key" ON "AddressSyncStatus"("address", "chainId", "tokenId");
