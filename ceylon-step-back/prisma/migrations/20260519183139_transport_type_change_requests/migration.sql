-- CreateTable
CREATE TABLE "TransportProviderTypeChangeRequest" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "currentType" "TransportProviderType" NOT NULL,
    "requestedType" "TransportProviderType" NOT NULL,
    "providerNotes" TEXT,
    "safariJeepLicenseUrl" TEXT,
    "brdDocumentUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdBy" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportProviderTypeChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportProviderTypeChangeRequest_profileId_idx" ON "TransportProviderTypeChangeRequest"("profileId");

-- CreateIndex
CREATE INDEX "TransportProviderTypeChangeRequest_status_idx" ON "TransportProviderTypeChangeRequest"("status");

-- AddForeignKey
ALTER TABLE "TransportProviderTypeChangeRequest" ADD CONSTRAINT "TransportProviderTypeChangeRequest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TransportProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportProviderTypeChangeRequest" ADD CONSTRAINT "TransportProviderTypeChangeRequest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportProviderTypeChangeRequest" ADD CONSTRAINT "TransportProviderTypeChangeRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
