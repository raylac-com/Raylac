/*
  Warnings:

  - You are about to drop the column `stealthPubKey` on the `UserStealthAddress` table. All the data in the column will be lost.
  - Made the column `address` on table `ERC5564Announcement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `signerAddress` on table `UserStealthAddress` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ERC5564Announcement" ALTER COLUMN "address" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserStealthAddress" DROP COLUMN "stealthPubKey",
ALTER COLUMN "signerAddress" SET NOT NULL;
