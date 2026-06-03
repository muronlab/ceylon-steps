-- Public display-name preference for activity providers.
-- false = show provider (full) name, true = show business name.
ALTER TABLE "m_activity_provider_profiles" ADD COLUMN "displayBusinessName" BOOLEAN NOT NULL DEFAULT false;
