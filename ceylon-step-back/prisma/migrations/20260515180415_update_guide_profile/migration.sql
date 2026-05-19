-- AlterTable
ALTER TABLE "GuideLanguage" ADD COLUMN     "countryCode" TEXT;

-- AlterTable
ALTER TABLE "GuideProfile" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
