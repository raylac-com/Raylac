-- DropForeignKey
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_from_fkey";

-- DropForeignKey
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_to_fkey";

-- AlterTable
ALTER TABLE "Trace" ADD COLUMN     "fromStealthAddress" TEXT,
ADD COLUMN     "toStealthAddress" TEXT;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_fromStealthAddress_fkey" FOREIGN KEY ("fromStealthAddress") REFERENCES "UserStealthAddress"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_toStealthAddress_fkey" FOREIGN KEY ("toStealthAddress") REFERENCES "UserStealthAddress"("address") ON DELETE SET NULL ON UPDATE CASCADE;
