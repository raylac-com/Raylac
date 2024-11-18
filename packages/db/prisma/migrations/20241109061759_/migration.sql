-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "userActionId" INTEGER;

-- AlterTable
ALTER TABLE "UserOperation" ADD COLUMN     "tag" TEXT;

-- CreateTable
CREATE TABLE "UserAction" (
    "id" SERIAL NOT NULL,
    "groupTag" TEXT,
    "groupSize" INTEGER NOT NULL,
    "txHashes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAction_txHashes_key" ON "UserAction"("txHashes");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userActionId_fkey" FOREIGN KEY ("userActionId") REFERENCES "UserAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
