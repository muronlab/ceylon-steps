-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'HATCHBACK', 'SUV', 'VAN', 'JEEP', 'PICKUP', 'MINIBUS', 'COACH', 'MOTORBIKE', 'TUKTUK', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleFuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'LPG', 'CNG');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'FAIR');

-- CreateEnum
CREATE TYPE "VehicleChargeType" AS ENUM ('PER_KM', 'PER_DAY', 'PER_HOUR', 'PER_WEEK', 'PER_MONTH', 'PER_TRIP', 'FLAT');

-- CreateTable
CREATE TABLE "TransportVehicle" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "manufacturedYear" INTEGER,
    "fuelType" "VehicleFuelType" NOT NULL,
    "fuelConsumption" TEXT,
    "condition" "VehicleCondition" NOT NULL DEFAULT 'GOOD',
    "facilities" TEXT[],
    "extraFacilities" TEXT[],
    "description" TEXT,
    "pickupLocation" TEXT,
    "dropoffLocation" TEXT,
    "sameDropoffAsPickup" BOOLEAN NOT NULL DEFAULT true,
    "allowsAnyLocation" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportVehicleImage" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportVehicleImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportVehicleCharge" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "chargeType" "VehicleChargeType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "includesFuel" BOOLEAN NOT NULL DEFAULT false,
    "nightSurcharge" DECIMAL(10,2),
    "minimumUnits" INTEGER,
    "label" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportVehicleCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportVehicle_profileId_idx" ON "TransportVehicle"("profileId");

-- CreateIndex
CREATE INDEX "TransportVehicleImage_vehicleId_idx" ON "TransportVehicleImage"("vehicleId");

-- CreateIndex
CREATE INDEX "TransportVehicleImage_vehicleId_sortOrder_idx" ON "TransportVehicleImage"("vehicleId", "sortOrder");

-- CreateIndex
CREATE INDEX "TransportVehicleCharge_vehicleId_idx" ON "TransportVehicleCharge"("vehicleId");

-- AddForeignKey
ALTER TABLE "TransportVehicle" ADD CONSTRAINT "TransportVehicle_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TransportProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportVehicleImage" ADD CONSTRAINT "TransportVehicleImage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "TransportVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportVehicleCharge" ADD CONSTRAINT "TransportVehicleCharge_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "TransportVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
