/*
  Warnings:

  - The primary key for the `Transfer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Transfer` table. All the data in the column will be lost.
  - Added the required column `traceId` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transferId` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_pkey",
DROP COLUMN "id",
ADD COLUMN     "traceId" TEXT NOT NULL,
ADD COLUMN     "transferId" TEXT NOT NULL,
ADD CONSTRAINT "Transfer_pkey" PRIMARY KEY ("traceId");
