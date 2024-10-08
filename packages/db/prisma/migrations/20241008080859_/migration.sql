/*
  Warnings:

  - Added the required column `maxBlockNumber` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "maxBlockNumber" BIGINT NOT NULL;
