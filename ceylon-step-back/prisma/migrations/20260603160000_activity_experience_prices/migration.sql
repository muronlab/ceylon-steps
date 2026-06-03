-- Activity providers can now record self-reported years of experience and
-- optional hourly/daily prices, mirroring the guide profile.
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "yearsOfExperience" INTEGER;
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "currency" TEXT;
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "pricePerHour" DECIMAL(12,2);
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "pricePerDay" DECIMAL(12,2);
