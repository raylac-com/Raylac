/*
  Warnings:

  - You are about to drop the column `blockNumber` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transaction_blockNumber_blockHash_chainId_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "blockNumber";

-- CreateTable
CREATE TABLE "Block" (
    "hash" TEXT NOT NULL,
    "number" BIGINT NOT NULL,
    "chainId" INTEGER NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("hash")
);

-- CreateIndex
CREATE UNIQUE INDEX "Block_number_chainId_key" ON "Block"("number", "chainId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_blockHash_fkey" FOREIGN KEY ("blockHash") REFERENCES "Block"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
