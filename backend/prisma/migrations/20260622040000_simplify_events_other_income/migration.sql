-- Drop event payments (income now handled in Payment table)
DROP TABLE "EventPayment";
DROP TYPE "EventPaymentType";

-- Simplify OneDayEvent: keep only counts + metadata
ALTER TABLE "OneDayEvent" DROP COLUMN "pricePerAttendee";
ALTER TABLE "OneDayEvent" DROP COLUMN "pricePerConstellation";
ALTER TABLE "OneDayEvent" DROP COLUMN "expenses";

-- Payment: allow generic income (no student / module) and add concept
ALTER TABLE "Payment" ALTER COLUMN "studentId" DROP NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "moduleId" DROP NOT NULL;
ALTER TABLE "Payment" ADD COLUMN "concept" TEXT;
