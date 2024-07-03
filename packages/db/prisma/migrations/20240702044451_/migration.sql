-- CreateTable
CREATE TABLE "StealthTransfer" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "to" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "userOpHashes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StealthTransfer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StealthTransfer" ADD CONSTRAINT "StealthTransfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
