-- Unify the itinerary tables — itineraries are no longer guide-only.
-- Safari jeep providers can now create itineraries linked to one of their
-- jeeps. Schema-side, we add a nullable `safariJeepId` and relax
-- `guideProfileId` so exactly one of them is set per row.

ALTER TABLE "m_guide_itineraries" RENAME TO "m_itineraries";
ALTER TABLE "m_guide_itinerary_days" RENAME TO "m_itinerary_days";
ALTER TABLE "m_guide_itinerary_inclusions" RENAME TO "m_itinerary_inclusions";
ALTER TABLE "m_guide_itinerary_images" RENAME TO "m_itinerary_images";

-- Relax guideProfileId — itineraries can now be owned by safari jeeps too.
ALTER TABLE "m_itineraries" ALTER COLUMN "guideProfileId" DROP NOT NULL;

-- New FK to safari jeeps.
ALTER TABLE "m_itineraries" ADD COLUMN "safariJeepId" TEXT;
ALTER TABLE "m_itineraries"
  ADD CONSTRAINT "m_itineraries_safariJeepId_fkey"
  FOREIGN KEY ("safariJeepId") REFERENCES "m_safari_jeeps"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX "m_itineraries_safariJeepId_idx" ON "m_itineraries"("safariJeepId");

-- Application-level invariant (enforced in the service): exactly one of
-- guideProfileId / safariJeepId is non-null. Add a CHECK constraint as a
-- belt-and-braces safeguard.
ALTER TABLE "m_itineraries"
  ADD CONSTRAINT "m_itineraries_one_owner_chk"
  CHECK (
    ("guideProfileId" IS NOT NULL AND "safariJeepId" IS NULL) OR
    ("guideProfileId" IS NULL AND "safariJeepId" IS NOT NULL)
  );
