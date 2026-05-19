-- CreateTable
CREATE TABLE "GuideProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "whatsappAvailable" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT NOT NULL,
    "nicNumber" TEXT NOT NULL,
    "registrationNo" TEXT,
    "email" TEXT NOT NULL,
    "guideLicenseExpiryDate" TIMESTAMP(3),
    "nicFrontUrl" TEXT NOT NULL,
    "nicBackUrl" TEXT NOT NULL,
    "guideLicenseFrontUrl" TEXT,
    "guideLicenseBackUrl" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuideProfile_userId_key" ON "GuideProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideProfile_applicationId_key" ON "GuideProfile"("applicationId");

-- CreateIndex
CREATE INDEX "GuideProfile_userId_idx" ON "GuideProfile"("userId");

-- CreateIndex
CREATE INDEX "GuideProfile_applicationId_idx" ON "GuideProfile"("applicationId");

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "GuideApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
