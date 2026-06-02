-- CreateTable
CREATE TABLE "t_activity_provider_applications" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "whatsappAvailable" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT,
    "usesAccountEmail" BOOLEAN NOT NULL DEFAULT true,
    "nicNumber" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "natureOfBusiness" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "nicFrontUrl" TEXT NOT NULL,
    "nicBackUrl" TEXT NOT NULL,
    "brdDocumentUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "statusUpdatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_activity_provider_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_activity_application_status_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "remark" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_activity_application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_activity_provider_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "whatsappAvailable" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT,
    "nicNumber" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "natureOfBusiness" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "nicFrontUrl" TEXT NOT NULL,
    "nicBackUrl" TEXT NOT NULL,
    "brdDocumentUrl" TEXT,
    "profilePhotoUrl" TEXT,
    "coverPhotoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminEnabled" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_activity_provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_activity_provider_profiles_userId_key" ON "m_activity_provider_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "m_activity_provider_profiles_applicationId_key" ON "m_activity_provider_profiles"("applicationId");

-- CreateIndex
CREATE INDEX "m_activity_provider_profiles_userId_idx" ON "m_activity_provider_profiles"("userId");

-- CreateIndex
CREATE INDEX "m_activity_provider_profiles_applicationId_idx" ON "m_activity_provider_profiles"("applicationId");

-- AddForeignKey
ALTER TABLE "t_activity_provider_applications" ADD CONSTRAINT "t_activity_provider_applications_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "m_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_activity_provider_applications" ADD CONSTRAINT "t_activity_provider_applications_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "m_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_activity_provider_applications" ADD CONSTRAINT "t_activity_provider_applications_statusUpdatedBy_fkey" FOREIGN KEY ("statusUpdatedBy") REFERENCES "m_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_activity_application_status_history" ADD CONSTRAINT "t_activity_application_status_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "t_activity_provider_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_activity_application_status_history" ADD CONSTRAINT "t_activity_application_status_history_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "m_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_activity_provider_profiles" ADD CONSTRAINT "m_activity_provider_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "m_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_activity_provider_profiles" ADD CONSTRAINT "m_activity_provider_profiles_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "t_activity_provider_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
