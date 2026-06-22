-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('TRAINING_CONSTELLATIONS', 'BIODECODING_CERTIFICATION', 'ONE_DAY_CONSTELLATION_EVENT');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OneDayEventStatus" AS ENUM ('SCHEDULED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventPaymentType" AS ENUM ('ASISTENTE', 'CONSTELACION', 'OTRO');

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProgramType" NOT NULL,
    "description" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- Seed default programs (fixed UUIDs for idempotent references)
INSERT INTO "Program" ("id", "name", "type", "status", "updatedAt") VALUES
    ('11111111-1111-1111-1111-111111111111', 'Formación en Constelaciones Familiares y Terapia Sistémica', 'TRAINING_CONSTELLATIONS', 'ACTIVE', CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'Certificación en Biodescodificación', 'BIODECODING_CERTIFICATION', 'ACTIVE', CURRENT_TIMESTAMP),
    ('33333333-3333-3333-3333-333333333333', 'Constelaciones de un día', 'ONE_DAY_CONSTELLATION_EVENT', 'ACTIVE', CURRENT_TIMESTAMP);

-- AlterTable Group: add programId (nullable -> backfill -> not null)
ALTER TABLE "Group" ADD COLUMN "programId" TEXT;
UPDATE "Group" SET "programId" = '11111111-1111-1111-1111-111111111111' WHERE "programId" IS NULL;
ALTER TABLE "Group" ALTER COLUMN "programId" SET NOT NULL;

-- AlterTable Module: drop global unique on number, add programId (nullable -> backfill -> not null)
DROP INDEX "Module_number_key";
ALTER TABLE "Module" ADD COLUMN "programId" TEXT;
UPDATE "Module" SET "programId" = '11111111-1111-1111-1111-111111111111' WHERE "programId" IS NULL;
ALTER TABLE "Module" ALTER COLUMN "programId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Module_programId_number_key" ON "Module"("programId", "number");

-- CreateTable
CREATE TABLE "OneDayEvent" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "attendeesCount" INTEGER NOT NULL DEFAULT 0,
    "constellatedCount" INTEGER NOT NULL DEFAULT 0,
    "pricePerAttendee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerConstellation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observations" TEXT,
    "status" "OneDayEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneDayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPayment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "EventPaymentType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observation" TEXT,
    "registeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneDayEvent" ADD CONSTRAINT "OneDayEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPayment" ADD CONSTRAINT "EventPayment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "OneDayEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPayment" ADD CONSTRAINT "EventPayment_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
