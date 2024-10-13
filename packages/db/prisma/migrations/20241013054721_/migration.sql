/*
  Warnings:

  - The primary key for the `Trace` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `transferId` on the `Trace` table. All the data in the column will be lost.
  - The `id` column on the `Trace` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Transfer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `from` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_transferId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_toUserId_fkey";

-- AlterTable
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_pkey",
DROP COLUMN "transferId",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Trace_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "from" TEXT NOT NULL,
ADD COLUMN     "to" TEXT;

-- DropTable
DROP TABLE "Transfer";
