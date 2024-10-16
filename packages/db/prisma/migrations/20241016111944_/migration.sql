/*
  Warnings:

  - You are about to drop the column `viewingPrivKey` on the `User` table. All the data in the column will be lost.
  - Made the column `encryptedViewingPrivKey` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_viewingPrivKey_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "viewingPrivKey",
ALTER COLUMN "encryptedViewingPrivKey" SET NOT NULL;
