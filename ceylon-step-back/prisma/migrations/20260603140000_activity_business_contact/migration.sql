-- Business-level contact details for activity providers.
-- NULL means "same as the provider's value" (contactEmail / mobileNumber / address).
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "businessEmail" TEXT;
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "businessPhone" TEXT;
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "businessAddress" TEXT;
