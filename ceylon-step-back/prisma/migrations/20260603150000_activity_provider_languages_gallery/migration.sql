-- Activity providers can now curate spoken/service languages (with level) and a
-- photo gallery, mirroring the guide profile feature set.
-- Index/constraint names are kept short to stay within Postgres' 63-char limit.

-- ── Languages ───────────────────────────────────────────────────────
CREATE TABLE "m_activity_provider_languages" (
    "id" TEXT NOT NULL,
    "activityProviderProfileId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "level" "LanguageLevel" NOT NULL,
    "countryCode" TEXT,

    CONSTRAINT "m_activity_provider_languages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "m_apl_profile_language_key"
    ON "m_activity_provider_languages"("activityProviderProfileId", "language");

CREATE INDEX "m_apl_profile_idx"
    ON "m_activity_provider_languages"("activityProviderProfileId");

ALTER TABLE "m_activity_provider_languages"
    ADD CONSTRAINT "m_apl_profile_fkey"
    FOREIGN KEY ("activityProviderProfileId")
    REFERENCES "m_activity_provider_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Gallery ─────────────────────────────────────────────────────────
CREATE TABLE "m_activity_provider_gallery_images" (
    "id" TEXT NOT NULL,
    "activityProviderProfileId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_activity_provider_gallery_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "m_apgi_profile_idx"
    ON "m_activity_provider_gallery_images"("activityProviderProfileId");

CREATE INDEX "m_apgi_profile_sort_idx"
    ON "m_activity_provider_gallery_images"("activityProviderProfileId", "sortOrder");

ALTER TABLE "m_activity_provider_gallery_images"
    ADD CONSTRAINT "m_apgi_profile_fkey"
    FOREIGN KEY ("activityProviderProfileId")
    REFERENCES "m_activity_provider_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
