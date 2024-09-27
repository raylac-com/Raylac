/*
  Warnings:

  - You are about to alter the column `nonce` on the `UserOperation` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "UserOperation" ALTER COLUMN "nonce" SET DATA TYPE INTEGER;
