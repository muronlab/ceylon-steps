-- The one-owner CHECK constraint predated activity-provider ownership: it only
-- permitted guide- or safari-owned itineraries, so every activity-provider
-- itinerary (both guideProfileId and safariJeepId null) violated it. Widen the
-- invariant to "exactly one of the three owner FKs is set".
ALTER TABLE "m_itineraries" DROP CONSTRAINT IF EXISTS "m_itineraries_one_owner_chk";

ALTER TABLE "m_itineraries"
  ADD CONSTRAINT "m_itineraries_one_owner_chk"
  CHECK (
    num_nonnulls("guideProfileId", "safariJeepId", "activityProviderProfileId") = 1
  );
