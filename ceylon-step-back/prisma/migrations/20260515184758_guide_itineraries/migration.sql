-- CreateEnum
CREATE TYPE "ItineraryInclusionKind" AS ENUM ('INCLUDED', 'EXCLUDED');

-- CreateTable
CREATE TABLE "GuideItinerary" (
    "id" TEXT NOT NULL,
    "guideProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "durationDays" INTEGER,
    "durationLabel" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT,
    "overview" TEXT,
    "transportation" TEXT,
    "meetingLocation" TEXT,
    "imageGradient" TEXT,
    "coverImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideItineraryDay" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GuideItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideItineraryInclusion" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "kind" "ItineraryInclusionKind" NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GuideItineraryInclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideItineraryImage" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideItineraryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuideItinerary_guideProfileId_idx" ON "GuideItinerary"("guideProfileId");

-- CreateIndex
CREATE INDEX "GuideItinerary_guideProfileId_sortOrder_idx" ON "GuideItinerary"("guideProfileId", "sortOrder");

-- CreateIndex
CREATE INDEX "GuideItineraryDay_itineraryId_idx" ON "GuideItineraryDay"("itineraryId");

-- CreateIndex
CREATE INDEX "GuideItineraryDay_itineraryId_sortOrder_idx" ON "GuideItineraryDay"("itineraryId", "sortOrder");

-- CreateIndex
CREATE INDEX "GuideItineraryInclusion_itineraryId_idx" ON "GuideItineraryInclusion"("itineraryId");

-- CreateIndex
CREATE INDEX "GuideItineraryImage_itineraryId_idx" ON "GuideItineraryImage"("itineraryId");

-- CreateIndex
CREATE INDEX "GuideItineraryImage_itineraryId_sortOrder_idx" ON "GuideItineraryImage"("itineraryId", "sortOrder");

-- AddForeignKey
ALTER TABLE "GuideItinerary" ADD CONSTRAINT "GuideItinerary_guideProfileId_fkey" FOREIGN KEY ("guideProfileId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideItineraryDay" ADD CONSTRAINT "GuideItineraryDay_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "GuideItinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideItineraryInclusion" ADD CONSTRAINT "GuideItineraryInclusion_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "GuideItinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideItineraryImage" ADD CONSTRAINT "GuideItineraryImage_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "GuideItinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
