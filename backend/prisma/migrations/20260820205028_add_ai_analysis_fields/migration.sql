-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "possibleCauses" JSONB,
ADD COLUMN     "prevention" TEXT;
