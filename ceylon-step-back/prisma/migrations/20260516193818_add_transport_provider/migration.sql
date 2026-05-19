-- CreateEnum
CREATE TYPE "ItineraryDesignType" AS ENUM ('DAYS', 'TIME');

-- AlterTable
ALTER TABLE "GuideItinerary" ADD COLUMN     "designType" "ItineraryDesignType" NOT NULL DEFAULT 'DAYS',
ADD COLUMN     "languagesOffered" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "GuideItineraryDay" ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startTime" TEXT;
