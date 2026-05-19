-- AlterTable
ALTER TABLE "GuideProfile" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "pricePerDay" DECIMAL(12,2),
ADD COLUMN     "pricePerHour" DECIMAL(12,2),
ADD COLUMN     "yearsOfExperience" INTEGER;
