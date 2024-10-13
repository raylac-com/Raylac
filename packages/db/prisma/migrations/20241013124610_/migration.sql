/*
  Warnings:

  - Changed the type of `timestamp` on the `Block` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Block" DROP COLUMN "timestamp",
ADD COLUMN     "timestamp" BIGINT NOT NULL;
