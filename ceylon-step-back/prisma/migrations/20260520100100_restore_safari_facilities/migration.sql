-- Restore the safari facilities arrays — earlier we merged them into
-- inclusions, but inclusions describe what's bundled with the trip while
-- facilities describe physical jeep features (raised seats, canopy, etc.).
-- Keep them separate.

ALTER TABLE "m_safari_jeeps"
  ADD COLUMN IF NOT EXISTS "facilities" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "m_safari_jeeps"
  ADD COLUMN IF NOT EXISTS "extraFacilities" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Drop the defaults — Prisma schema doesn't declare a default on these,
-- and we don't want NULLs becoming the literal string "ARRAY[]" later.
ALTER TABLE "m_safari_jeeps" ALTER COLUMN "facilities" DROP DEFAULT;
ALTER TABLE "m_safari_jeeps" ALTER COLUMN "extraFacilities" DROP DEFAULT;

-- Backfill any NULLs that snuck in (shouldn't happen with the default but be safe).
UPDATE "m_safari_jeeps" SET "facilities" = ARRAY[]::TEXT[] WHERE "facilities" IS NULL;
UPDATE "m_safari_jeeps" SET "extraFacilities" = ARRAY[]::TEXT[] WHERE "extraFacilities" IS NULL;

ALTER TABLE "m_safari_jeeps" ALTER COLUMN "facilities" SET NOT NULL;
ALTER TABLE "m_safari_jeeps" ALTER COLUMN "extraFacilities" SET NOT NULL;
