-- AlterTable
ALTER TABLE "UserStealthAddress" ADD COLUMN     "signerAddress" TEXT,
ALTER COLUMN "stealthPubKey" DROP NOT NULL;
