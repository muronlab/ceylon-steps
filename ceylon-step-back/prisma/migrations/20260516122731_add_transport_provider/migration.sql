-- CreateEnum
CREATE TYPE "TransportProviderType" AS ENUM ('SAFARI_JEEP', 'VEHICLE_WITH_DRIVER', 'DRIVER_ONLY', 'VEHICLE_FLEET');

-- CreateTable
CREATE TABLE "TransportProviderApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "whatsappAvailable" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT NOT NULL,
    "usesAccountEmail" BOOLEAN NOT NULL DEFAULT true,
    "providerType" "TransportProviderType" NOT NULL,
    "hasBusiness" BOOLEAN NOT NULL DEFAULT false,
    "businessName" TEXT,
    "businessDescription" TEXT,
    "nicFrontUrl" TEXT NOT NULL,
    "nicBackUrl" TEXT NOT NULL,
    "brdDocumentUrl" TEXT,
    "safariJeepLicenseUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "statusUpdatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportProviderApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "remark" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportProviderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "whatsappAvailable" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT NOT NULL,
    "providerType" "TransportProviderType" NOT NULL,
    "hasBusiness" BOOLEAN NOT NULL DEFAULT false,
    "businessName" TEXT,
    "businessDescription" TEXT,
    "nicFrontUrl" TEXT NOT NULL,
    "nicBackUrl" TEXT NOT NULL,
    "brdDocumentUrl" TEXT,
    "safariJeepLicenseUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransportProviderProfile_userId_key" ON "TransportProviderProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportProviderProfile_applicationId_key" ON "TransportProviderProfile"("applicationId");

-- CreateIndex
CREATE INDEX "TransportProviderProfile_userId_idx" ON "TransportProviderProfile"("userId");

-- CreateIndex
CREATE INDEX "TransportProviderProfile_applicationId_idx" ON "TransportProviderProfile"("applicationId");

-- AddForeignKey
ALTER TABLE "TransportProviderApplication" ADD CONSTRAINT "TransportProviderApplication_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportProviderApplication" ADD CONSTRAINT "TransportProviderApplication_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportProviderApplication" ADD CONSTRAINT "TransportProviderApplication_statusUpdatedBy_fkey" FOREIGN KEY ("statusUpdatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportApplicationStatusHistory" ADD CONSTRAINT "TransportApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TransportProviderApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportApplicationStatusHistory" ADD CONSTRAINT "TransportApplicationStatusHistory_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportProviderProfile" ADD CONSTRAINT "TransportProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportProviderProfile" ADD CONSTRAINT "TransportProviderProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TransportProviderApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
