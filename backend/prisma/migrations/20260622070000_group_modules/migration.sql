-- DropForeignKey
ALTER TABLE "ClassSession" DROP CONSTRAINT "ClassSession_moduleId_fkey";
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_moduleId_fkey";

-- DropTable Module (replaced by GroupModule + ProgramModuleTemplate)
DROP TABLE "Module";

-- AlterTable ClassSession: moduleId -> groupModuleId
ALTER TABLE "ClassSession" DROP COLUMN "moduleId";
ALTER TABLE "ClassSession" ADD COLUMN "groupModuleId" TEXT;

-- AlterTable Payment: moduleId -> groupModuleId
ALTER TABLE "Payment" DROP COLUMN "moduleId";
ALTER TABLE "Payment" ADD COLUMN "groupModuleId" TEXT;

-- CreateTable
CREATE TABLE "ProgramModuleTemplate" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "defaultPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramModuleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupModule" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" "ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramModuleTemplate_programId_moduleNumber_key" ON "ProgramModuleTemplate"("programId", "moduleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GroupModule_groupId_moduleNumber_key" ON "GroupModule"("groupId", "moduleNumber");

-- AddForeignKey
ALTER TABLE "ProgramModuleTemplate" ADD CONSTRAINT "ProgramModuleTemplate_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupModule" ADD CONSTRAINT "GroupModule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupModule" ADD CONSTRAINT "GroupModule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_groupModuleId_fkey" FOREIGN KEY ("groupModuleId") REFERENCES "GroupModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_groupModuleId_fkey" FOREIGN KEY ("groupModuleId") REFERENCES "GroupModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default module templates per program
INSERT INTO "ProgramModuleTemplate" ("id", "programId", "moduleNumber", "name", "defaultPrice", "status", "updatedAt")
SELECT
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    n,
    'Módulo ' || n,
    300000,
    'ACTIVE',
    CURRENT_TIMESTAMP
FROM generate_series(1, 11) AS n;

INSERT INTO "ProgramModuleTemplate" ("id", "programId", "moduleNumber", "name", "defaultPrice", "status", "updatedAt")
SELECT
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    n,
    'Módulo ' || n,
    300000,
    'ACTIVE',
    CURRENT_TIMESTAMP
FROM generate_series(1, 6) AS n;
