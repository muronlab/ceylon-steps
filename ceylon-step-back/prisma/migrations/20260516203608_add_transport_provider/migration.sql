-- CreateEnum
CREATE TYPE "ItineraryPriceScope" AS ENUM ('PER_PERSON', 'PER_GROUP', 'PER_DAY');

-- AlterTable
ALTER TABLE "GuideItinerary" ADD COLUMN     "priceScope" "ItineraryPriceScope" NOT NULL DEFAULT 'PER_PERSON';
