-- AlterTable
ALTER TABLE "UserAction" ADD COLUMN     "paidAngelRequestId" INTEGER;

-- CreateTable
CREATE TABLE "AngelRequest" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AngelRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_paidAngelRequestId_fkey" FOREIGN KEY ("paidAngelRequestId") REFERENCES "AngelRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AngelRequest" ADD CONSTRAINT "AngelRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
