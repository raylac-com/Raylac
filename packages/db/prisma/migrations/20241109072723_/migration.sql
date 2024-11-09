/*
  Warnings:

  - Added the required column `timestamp` to the `UserAction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserAction" ADD COLUMN     "timestamp" BIGINT NOT NULL;
