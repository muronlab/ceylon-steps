-- AlterTable
ALTER TABLE "GuideProfile" ADD COLUMN     "regionsSpecialized" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tagline" TEXT;
