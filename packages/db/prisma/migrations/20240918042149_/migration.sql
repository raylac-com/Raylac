/*
  Warnings:

  - The primary key for the `TransferTrace` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TransferTrace` table. All the data in the column will be lost.
  - Added the required column `traceAddress` to the `TransferTrace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransferTrace" DROP CONSTRAINT "TransferTrace_pkey",
DROP COLUMN "id",
ADD COLUMN     "traceAddress" TEXT NOT NULL,
ADD CONSTRAINT "TransferTrace_pkey" PRIMARY KEY ("txHash", "traceAddress");
