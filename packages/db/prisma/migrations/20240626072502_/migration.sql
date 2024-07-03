/*
  Warnings:

  - You are about to drop the column `publicKey` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[spendingPubKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[viewingPubKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `spendingPubKey` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `viewingPubKey` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_publicKey_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "publicKey",
ADD COLUMN     "spendingPubKey" TEXT NOT NULL,
ADD COLUMN     "viewingPubKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_spendingPubKey_key" ON "User"("spendingPubKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_viewingPubKey_key" ON "User"("viewingPubKey");
