-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "summary" TEXT,
ALTER COLUMN "possibleCauses" SET DATA TYPE TEXT;
