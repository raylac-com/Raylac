-- CreateTable
CREATE TABLE "UserOperationReceipt" (
    "hash" TEXT NOT NULL,
    "nonce" BIGINT,
    "success" BOOLEAN,
    "actualGasUsed" BIGINT,
    "actualGasCost" BIGINT,
    "blockNumber" BIGINT,
    "logIndex" INTEGER,
    "txIndex" INTEGER,
    "chainId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOperationReceipt_pkey" PRIMARY KEY ("hash")
);
