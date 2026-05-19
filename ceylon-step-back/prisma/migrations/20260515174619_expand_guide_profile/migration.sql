-- CreateEnum
CREATE TYPE "LanguageLevel" AS ENUM ('CONVERSATIONAL', 'FLUENT', 'NATIVE');

-- AlterTable
ALTER TABLE "GuideProfile" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "coverPhotoUrl" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- CreateTable
CREATE TABLE "GuideLanguage" (
    "id" TEXT NOT NULL,
    "guideProfileId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "level" "LanguageLevel" NOT NULL,

    CONSTRAINT "GuideLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideGalleryImage" (
    "id" TEXT NOT NULL,
    "guideProfileId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuideLanguage_guideProfileId_idx" ON "GuideLanguage"("guideProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideLanguage_guideProfileId_language_key" ON "GuideLanguage"("guideProfileId", "language");

-- CreateIndex
CREATE INDEX "GuideGalleryImage_guideProfileId_idx" ON "GuideGalleryImage"("guideProfileId");

-- CreateIndex
CREATE INDEX "GuideGalleryImage_guideProfileId_sortOrder_idx" ON "GuideGalleryImage"("guideProfileId", "sortOrder");

-- AddForeignKey
ALTER TABLE "GuideLanguage" ADD CONSTRAINT "GuideLanguage_guideProfileId_fkey" FOREIGN KEY ("guideProfileId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideGalleryImage" ADD CONSTRAINT "GuideGalleryImage_guideProfileId_fkey" FOREIGN KEY ("guideProfileId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
