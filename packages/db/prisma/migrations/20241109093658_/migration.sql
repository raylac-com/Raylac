-- AddForeignKey
ALTER TABLE "UserOperation" ADD CONSTRAINT "UserOperation_sender_fkey" FOREIGN KEY ("sender") REFERENCES "UserStealthAddress"("address") ON DELETE SET NULL ON UPDATE CASCADE;
