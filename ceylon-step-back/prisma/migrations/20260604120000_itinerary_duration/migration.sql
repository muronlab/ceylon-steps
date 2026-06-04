-- Itineraries can now be described by a single total duration (e.g. "4 hours")
-- as a third design type, alongside multi-day (DAYS) and single-day-with-times
-- (TIME). `durationMinutes` carries the length; it is null for DAYS / TIME.
ALTER TYPE "ItineraryDesignType" ADD VALUE IF NOT EXISTS 'DURATION';

ALTER TABLE "m_itineraries" ADD COLUMN "durationMinutes" INTEGER;
