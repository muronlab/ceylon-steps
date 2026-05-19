-- AlterTable
ALTER TABLE "TransportVehicle" ADD COLUMN     "plateNumber" TEXT,
ADD COLUMN     "plateNumberVisible" BOOLEAN NOT NULL DEFAULT false;
