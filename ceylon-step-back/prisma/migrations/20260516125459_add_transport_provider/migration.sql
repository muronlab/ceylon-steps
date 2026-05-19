/*
  Warnings:

  - The values [DRIVER_ONLY] on the enum `TransportProviderType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransportProviderType_new" AS ENUM ('SAFARI_JEEP', 'VEHICLE_WITH_DRIVER', 'VEHICLE_FLEET');
ALTER TABLE "TransportProviderApplication" ALTER COLUMN "providerType" TYPE "TransportProviderType_new" USING ("providerType"::text::"TransportProviderType_new");
ALTER TABLE "TransportProviderProfile" ALTER COLUMN "providerType" TYPE "TransportProviderType_new" USING ("providerType"::text::"TransportProviderType_new");
ALTER TYPE "TransportProviderType" RENAME TO "TransportProviderType_old";
ALTER TYPE "TransportProviderType_new" RENAME TO "TransportProviderType";
DROP TYPE "public"."TransportProviderType_old";
COMMIT;
