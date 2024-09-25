-- CreateEnum
CREATE TYPE "SyncJob" AS ENUM ('Traces', 'UserOps');

-- CreateTable
CREATE TABLE "SyncStatus" (
    "id" SERIAL NOT NULL,
    "lastSyncedBlockNum" BIGINT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "job" "SyncJob" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatus_chainId_job_key" ON "SyncStatus"("chainId", "job");
