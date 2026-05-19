-- CreateEnum
CREATE TYPE "SafariChargeType" AS ENUM ('PER_PERSON', 'PER_JEEP', 'PER_TRIP', 'PER_HOUR', 'PER_DAY', 'FLAT');

-- CreateTable
CREATE TABLE "SafariJeep" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'JEEP',
    "manufacturedYear" INTEGER,
    "fuelType" "VehicleFuelType" NOT NULL DEFAULT 'DIESEL',
    "fuelConsumption" TEXT,
    "condition" "VehicleCondition" NOT NULL DEFAULT 'GOOD',
    "passengerCapacity" INTEGER,
    "plateNumber" TEXT,
    "plateNumberVisible" BOOLEAN NOT NULL DEFAULT false,
    "driverName" TEXT NOT NULL,
    "driverPhotoUrl" TEXT,
    "driverYearsExperience" INTEGER,
    "driverBio" TEXT,
    "driverLanguages" TEXT[],
    "driverSpecialties" TEXT[],
    "driverGuidesAtParks" BOOLEAN NOT NULL DEFAULT true,
    "nationalParks" TEXT[],
    "experiences" TEXT[],
    "durationNotes" TEXT,
    "facilities" TEXT[],
    "extraFacilities" TEXT[],
    "inclusions" TEXT[],
    "exclusions" TEXT[],
    "description" TEXT,
    "pickupLocation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafariJeep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafariJeepImage" (
    "id" TEXT NOT NULL,
    "safariJeepId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafariJeepImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafariJeepCharge" (
    "id" TEXT NOT NULL,
    "safariJeepId" TEXT NOT NULL,
    "chargeType" "SafariChargeType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "includesParkFee" BOOLEAN NOT NULL DEFAULT false,
    "minimumUnits" INTEGER,
    "label" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafariJeepCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SafariJeep_profileId_idx" ON "SafariJeep"("profileId");

-- CreateIndex
CREATE INDEX "SafariJeepImage_safariJeepId_idx" ON "SafariJeepImage"("safariJeepId");

-- CreateIndex
CREATE INDEX "SafariJeepImage_safariJeepId_sortOrder_idx" ON "SafariJeepImage"("safariJeepId", "sortOrder");

-- CreateIndex
CREATE INDEX "SafariJeepCharge_safariJeepId_idx" ON "SafariJeepCharge"("safariJeepId");

-- AddForeignKey
ALTER TABLE "SafariJeep" ADD CONSTRAINT "SafariJeep_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TransportProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafariJeepImage" ADD CONSTRAINT "SafariJeepImage_safariJeepId_fkey" FOREIGN KEY ("safariJeepId") REFERENCES "SafariJeep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafariJeepCharge" ADD CONSTRAINT "SafariJeepCharge_safariJeepId_fkey" FOREIGN KEY ("safariJeepId") REFERENCES "SafariJeep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
