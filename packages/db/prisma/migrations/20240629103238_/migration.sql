/*
  Warnings:

  - Added the required column `ephemeralPubKey` to the `UserStealthAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mixed` to the `UserStealthAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stealthPubKey` to the `UserStealthAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `viewTag` to the `UserStealthAddress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserStealthAddress" ADD COLUMN     "ephemeralPubKey" TEXT NOT NULL,
ADD COLUMN     "mixed" BOOLEAN NOT NULL,
ADD COLUMN     "stealthPubKey" TEXT NOT NULL,
ADD COLUMN     "viewTag" TEXT NOT NULL;
