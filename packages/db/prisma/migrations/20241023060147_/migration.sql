/*
  Warnings:

  - The values [StealthTransfers,StealthDeposits] on the enum `SyncJob` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `StealthDepositEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SyncJob_new" AS ENUM ('Traces', 'UserOps');
ALTER TABLE "SyncStatus" ALTER COLUMN "job" TYPE "SyncJob_new" USING ("job"::text::"SyncJob_new");
ALTER TYPE "SyncJob" RENAME TO "SyncJob_old";
ALTER TYPE "SyncJob_new" RENAME TO "SyncJob";
DROP TYPE "SyncJob_old";
COMMIT;

-- DropTable
DROP TABLE "StealthDepositEvent";

-- CreateTable
CREATE TABLE "Upgraded" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "newImplementation" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upgraded_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Upgraded_txHash_logIndex_key" ON "Upgraded"("txHash", "logIndex");

-- AddForeignKey
ALTER TABLE "Upgraded" ADD CONSTRAINT "Upgraded_address_fkey" FOREIGN KEY ("address") REFERENCES "UserStealthAddress"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upgraded" ADD CONSTRAINT "Upgraded_txHash_fkey" FOREIGN KEY ("txHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
