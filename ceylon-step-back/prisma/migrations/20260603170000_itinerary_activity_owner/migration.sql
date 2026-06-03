-- Itineraries can now be owned by an activity provider profile, in addition to
-- guides and safari jeeps. Exactly one owner FK is set per row.
ALTER TABLE "m_itineraries" ADD COLUMN "activityProviderProfileId" TEXT;

CREATE INDEX "m_itineraries_activityProviderProfileId_idx"
    ON "m_itineraries"("activityProviderProfileId");

CREATE INDEX "m_itineraries_apId_sortOrder_idx"
    ON "m_itineraries"("activityProviderProfileId", "sortOrder");

ALTER TABLE "m_itineraries"
    ADD CONSTRAINT "m_itineraries_activityProviderProfileId_fkey"
    FOREIGN KEY ("activityProviderProfileId")
    REFERENCES "m_activity_provider_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
