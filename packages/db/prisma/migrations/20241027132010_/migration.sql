-- CreateTable
CREATE TABLE "NativeTransferTrace" (
    "id" SERIAL NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "chainId" INTEGER NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "traceAddress" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NativeTransferTrace_pkey" PRIMARY KEY ("id")
);
