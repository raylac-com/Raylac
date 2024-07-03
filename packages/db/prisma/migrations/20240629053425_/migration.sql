/*
  Warnings:

  - A unique constraint covering the columns `[viewingPrivKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `viewingPrivKey` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "viewingPrivKey" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "UserStealthAddress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "ephemeralPubKey" TEXT NOT NULL,
    "viewTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStealthAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_viewingPrivKey_key" ON "User"("viewingPrivKey");

-- AddForeignKey
ALTER TABLE "UserStealthAddress" ADD CONSTRAINT "UserStealthAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
