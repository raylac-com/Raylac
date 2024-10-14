/*
  Warnings:

  - Added the required column `chainId` to the `Trace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trace" ADD COLUMN     "chainId" INTEGER NOT NULL;
