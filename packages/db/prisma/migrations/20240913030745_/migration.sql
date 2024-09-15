-- CreateEnum
CREATE TYPE "RelayExecutionStatus" AS ENUM ('refund', 'success', 'delayed', 'waiting', 'failure', 'pending');

-- CreateTable
CREATE TABLE "RelayIntent" (
    "requestId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "status" "RelayExecutionStatus" NOT NULL,
    "details" TEXT NOT NULL,
    "fees" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "inTxHashes" TEXT[],
    "outTxHashes" TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL,
    "originTokenId" INTEGER NOT NULL,
    "destinationTokenId" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "originChainId" INTEGER NOT NULL,
    "destinationChainId" INTEGER NOT NULL,

    CONSTRAINT "RelayIntent_pkey" PRIMARY KEY ("requestId")
);
