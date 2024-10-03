-- CreateTable
CREATE TABLE "ERC20TransferLog" (
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "executionTag" TEXT,
    "logIndex" INTEGER NOT NULL,
    "txIndex" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ERC20TransferLog_pkey" PRIMARY KEY ("txIndex","logIndex","blockNumber","chainId")
);

-- AddForeignKey
ALTER TABLE "ERC20TransferLog" ADD CONSTRAINT "ERC20TransferLog_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
