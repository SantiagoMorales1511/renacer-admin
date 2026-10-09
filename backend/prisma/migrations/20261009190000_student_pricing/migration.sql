-- AlterTable
ALTER TABLE "Student" ADD COLUMN "customPrice" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "StudentModulePrice" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupModuleId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentModulePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentModulePrice_studentId_groupModuleId_key" ON "StudentModulePrice"("studentId", "groupModuleId");

-- AddForeignKey
ALTER TABLE "StudentModulePrice" ADD CONSTRAINT "StudentModulePrice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentModulePrice" ADD CONSTRAINT "StudentModulePrice_groupModuleId_fkey" FOREIGN KEY ("groupModuleId") REFERENCES "GroupModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
