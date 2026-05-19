-- AlterTable
ALTER TABLE "GuideProfile" ADD COLUMN     "adminEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TransportProviderProfile" ADD COLUMN     "adminEnabled" BOOLEAN NOT NULL DEFAULT true;
