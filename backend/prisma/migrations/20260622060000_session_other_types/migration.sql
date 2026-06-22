-- AlterTable
ALTER TABLE "ClassSession" ALTER COLUMN "groupId" DROP NOT NULL;
ALTER TABLE "ClassSession" ALTER COLUMN "moduleId" DROP NOT NULL;
ALTER TABLE "ClassSession" ADD COLUMN "title" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN "oneDayEventId" TEXT;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_oneDayEventId_fkey" FOREIGN KEY ("oneDayEventId") REFERENCES "OneDayEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
