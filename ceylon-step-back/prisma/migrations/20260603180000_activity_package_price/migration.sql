-- Activity providers can offer a fixed package price (per person / per group)
-- as an alternative to the time-based hourly/daily rates. Reuses the existing
-- "ItineraryPriceScope" enum type for the scope.
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "packagePrice" DECIMAL(12,2);
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "packagePriceScope" "ItineraryPriceScope";
