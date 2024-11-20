/*
  Warnings:

  - Added the required column `title` to the `AngelRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AngelRequest" ADD COLUMN     "title" TEXT NOT NULL;
