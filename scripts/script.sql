-- Ceylon Step — required data
-- Run this against the Postgres database after `prisma migrate deploy` and
-- before booting the backend. Idempotent: re-running is safe.
--
--   psql "$DATABASE_URL" -f scripts/script.sql

-- pgcrypto provides gen_random_uuid(). Built-in on Postgres 13+ but the
-- extension still needs to be enabled in the target database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- m_roles — RBAC roles referenced by SessionAuthGuard / RolesGuard.
-- Names MUST match the values used in @Roles(...) decorators across the API.
-- Without these rows every role-gated endpoint will 403.
INSERT INTO m_roles (id, name) VALUES (gen_random_uuid(), 'USER')               ON CONFLICT (name) DO NOTHING;
INSERT INTO m_roles (id, name) VALUES (gen_random_uuid(), 'ADMIN')              ON CONFLICT (name) DO NOTHING;
INSERT INTO m_roles (id, name) VALUES (gen_random_uuid(), 'SUPER_ADMIN')        ON CONFLICT (name) DO NOTHING;
INSERT INTO m_roles (id, name) VALUES (gen_random_uuid(), 'GUIDE')              ON CONFLICT (name) DO NOTHING;
INSERT INTO m_roles (id, name) VALUES (gen_random_uuid(), 'TRANSPORT_PROVIDER') ON CONFLICT (name) DO NOTHING;
