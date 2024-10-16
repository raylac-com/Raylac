-- CreateTable
CREATE TABLE "TokenPrice" (
    "id" SERIAL NOT NULL,
    "tokenId" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenPrice_tokenId_timestamp_key" ON "TokenPrice"("tokenId", "timestamp");
