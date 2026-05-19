-- CreateEnum
CREATE TYPE "DriverServiceCategory" AS ENUM ('AIRPORT_PICKUP', 'AIRPORT_DROPOFF', 'CITY_TOUR', 'DAY_TOUR', 'ROUND_TOUR', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "DriverServicePriceUnit" AS ENUM ('PER_TRIP', 'PER_KM', 'PER_DAY', 'PER_HOUR', 'PER_PERSON', 'FLAT');

-- AlterTable
ALTER TABLE "TransportVehicle" ADD COLUMN     "exclusions" TEXT[],
ADD COLUMN     "inclusions" TEXT[];

-- CreateTable
CREATE TABLE "DriverService" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DriverServiceCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "coverImageUrl" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "priceUnit" "DriverServicePriceUnit" NOT NULL,
    "priceNotes" TEXT,
    "inclusions" TEXT[],
    "exclusions" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverService_profileId_idx" ON "DriverService"("profileId");

-- AddForeignKey
ALTER TABLE "DriverService" ADD CONSTRAINT "DriverService_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TransportProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
