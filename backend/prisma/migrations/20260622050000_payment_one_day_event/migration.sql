-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "oneDayEventId" TEXT;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_oneDayEventId_fkey" FOREIGN KEY ("oneDayEventId") REFERENCES "OneDayEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
