/*
  Warnings:

  - Added the required column `from` to the `NativeTransferTrace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NativeTransferTrace" ADD COLUMN     "from" BYTEA NOT NULL;
