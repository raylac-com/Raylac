/*
  Warnings:

  - You are about to drop the `IncomingTranfser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "IncomingTranfser";

-- CreateTable
CREATE TABLE "IncomingTransfer" (
    "id" SERIAL NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomingTransfer_pkey" PRIMARY KEY ("id")
);
