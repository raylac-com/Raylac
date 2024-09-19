/*
  Warnings:

  - The values [ERC20Transfer,ERC20AggregateBridgeTransfer,ERC20AggregateTransfer,ETHTransfer,ETHAggregateTransfer,ETHAggregateBridgeTransfer] on the enum `ExecutionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExecutionType_new" AS ENUM ('Transfer', 'BridgeTransfer', 'AggregateBridgeTransfer', 'AggregateTransfer');
ALTER TABLE "TransferTrace" ALTER COLUMN "executionType" TYPE "ExecutionType_new" USING ("executionType"::text::"ExecutionType_new");
ALTER TYPE "ExecutionType" RENAME TO "ExecutionType_old";
ALTER TYPE "ExecutionType_new" RENAME TO "ExecutionType";
DROP TYPE "ExecutionType_old";
COMMIT;
