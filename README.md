# Ceylon Step

A three-sided marketplace for Sri Lanka travel: **travelers** discover guides, transport providers, and safari operators; **partners** (guides, fleets, safari jeep owners, driver-owners) publish profiles and itineraries; **admins** vet applications and manage the platform.

This repository is a monorepo containing the API and the two frontends that talk to it.

## Projects

| Project | Folder | Stack | Port | Role |
| --- | --- | --- | --- | --- |
| Backend API | [`ceylon-step-back`](ceylon-step-back/) | NestJS 11 · Prisma 6 · PostgreSQL 14+ · Passport · Supabase Storage | `3000` | REST API at `/api/v1`. Auth, RBAC, applications, profiles, itineraries, file uploads, audit logging. |
| Public site & partner area | [`ceylon-steps-front`](ceylon-steps-front/) | Next.js 16 (App Router) · React 19 · Tailwind 4 · shadcn/ui · Tiptap | `3000` (configurable) | Marketing pages + partner self-service: apply, manage profile, vehicles, safari jeeps, driver services, itineraries. |
| Admin dashboard | [`ceylon-steps-admin`](ceylon-steps-admin/) | Next.js 16 (App Router) · React 19 · Tailwind 4 · shadcn/ui · TanStack Table | `3001` | Internal console. Reviews applications, manages users, approves transport-provider type-change requests, inspects partner data. |

Both frontends are **API clients only** — they call the backend at `/api/v1/...` and hold no business logic. Cookie-based session auth means CORS + `credentials: true` is non-negotiable.

## What it does

- **Travelers** browse approved guides and transport providers on the public site, see itineraries, hourly/daily rates, languages spoken, and contact partners directly.
- **Guides** apply with NIC + (optional) guide licence. Admin approves → a `GuideProfile` is auto-created from the application. The guide then edits bio, regions, languages, gallery, pricing, and creates itineraries.
- **Transport providers** apply as one of three types: `SAFARI_JEEP`, `VEHICLE_WITH_DRIVER`, or `VEHICLE_FLEET`. After approval they manage vehicles, safari jeeps (with inline driver details), driver services, and itineraries. They cannot change their `providerType` directly — they raise a type-change request that admin approves.
- **Admins** review every application in a queue, approve/reject with remarks, manage users, and resolve type-change requests. Two roles: `ADMIN` and `SUPER_ADMIN`. The latter can hard-delete and reassign.

## Architecture at a glance

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  ceylon-steps-front      │        │  ceylon-steps-admin      │
│  (Next.js 16, public +   │        │  (Next.js 16, admin      │
│   partner self-service)  │        │   console)               │
└────────────┬─────────────┘        └────────────┬─────────────┘
             │ axios + session cookie            │
             │ (credentials: true)               │
             ▼                                   ▼
        ┌────────────────────────────────────────────┐
        │            ceylon-step-back                │
        │  NestJS 11 · /api/v1                       │
        │                                            │
        │  Controller → Service → PrismaService      │
        │  Guards: SessionAuthGuard, RolesGuard      │
        │  Filter:  GlobalExceptionFilter            │
        │  Pipe:    ValidationPipe (class-validator) │
        └──────────────┬────────────────┬────────────┘
                       │                │
                       ▼                ▼
              ┌────────────────┐  ┌──────────────────┐
              │ PostgreSQL 14+ │  │ Supabase Storage │
              │ Prisma schema  │  │ (file uploads)   │
              │ m_*, t_*, r_*  │  └──────────────────┘
              └────────────────┘
```

See [`ceylon-step-back/README.md`](ceylon-step-back/README.md#architecture) for the full backend architecture (request pipeline, cross-cutting concerns, auth model, integrations).

## Repository layout

```
ceylon-steps/
├─ ceylon-step-back/      # NestJS API (the single source of truth)
├─ ceylon-steps-front/    # Public site + partner self-service (Next.js)
├─ ceylon-steps-admin/    # Admin dashboard (Next.js)
├─ scripts/
│   └─ script.sql         # Required reference data (roles) — run once after migrations
└─ README.md              # You are here
```

## Quick start

You need **Node.js 20+**, **pnpm**, and a running **PostgreSQL 14+** instance.

```bash
# 1. Backend — install, migrate, seed, run
cd ceylon-step-back
pnpm install
cp .env.example .env                              # edit DATABASE_URL, SESSION_SECRET, etc.
pnpm prisma:migrate                               # apply schema
psql "$DATABASE_URL" -f ../scripts/script.sql     # required reference data (roles)
# (or `pnpm db:seed` if you prefer the TS seeder)
pnpm start:dev                                    # listens on :3000, Swagger at :3000/api/docs

# 2. Public site (new terminal)
cd ceylon-steps-front
pnpm install
cp .env.example .env.local                        # set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
pnpm dev

# 3. Admin dashboard (new terminal)
cd ceylon-steps-admin
pnpm install
cp .env.example .env.local                        # set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
pnpm dev -- -p 3001                               # admin runs on :3001
```

Open the public site at `http://localhost:3000` and the admin at `http://localhost:3001`.

> **Port collision:** the backend and the public frontend both default to `3000`. In dev, run the backend on `3000` and the public site on `3002` (or any free port) — the frontend's API base is configured via `NEXT_PUBLIC_API_BASE_URL`, so the actual port doesn't matter for the client.

## Required database data

After `prisma migrate deploy`, the DB has tables but no rows. The app needs the five RBAC roles to be present before any auth flow works. There are two equivalent ways to insert them:

| Method | Command | When to use |
| --- | --- | --- |
| TypeScript seeder | `cd ceylon-step-back && pnpm db:seed` | Local dev with Node available. |
| Raw SQL | `psql "$DATABASE_URL" -f scripts/script.sql` | Bootstrapping prod / CI / DBA-managed environments. |

Both are idempotent and produce the same result.

## Tech choices

- **Why NestJS?** First-class TypeScript, decorator-driven Swagger, clean module boundaries — a comfortable fit for a domain with several distinct partner types.
- **Why Prisma?** Type-safe migrations and a clear schema-as-code model. The `m_*` / `t_*` / `r_*` table prefixes are enforced via `@@map`.
- **Why cookie sessions over JWT?** We control both frontends and the API; sliding expiry + server-side revocation (`sessionInvalidBefore`) gives stronger guarantees than stateless JWTs.
- **Why Supabase Storage?** Hosted bucket with public URLs, S3-compatible if we ever need to swap it out — see `ceylon-step-back/src/storage`.
- **Why two frontends?** Different audiences (travelers + partners vs. admins), different navigation, different security posture. One repo per audience keeps each app focused.

## Documentation

| Doc | Where |
| --- | --- |
| Backend API + architecture | [`ceylon-step-back/README.md`](ceylon-step-back/README.md) |
| Public site & partner area | [`ceylon-steps-front/README.md`](ceylon-steps-front/README.md) |
| Admin dashboard | [`ceylon-steps-admin/README.md`](ceylon-steps-admin/README.md) |
| Swagger UI (when backend is running) | `http://localhost:3000/api/docs` |

## Conventions

- **Currency:** LKR primary; USD shown in parentheses for international contexts.
- **Dates in UI:** `DD MMM YYYY`.
- **Tables:** `m_*` master, `t_*` transactional, `r_*` reference / junction — physical name only; Prisma models stay PascalCase.
- **Errors:** every API error follows the `GlobalExceptionFilter` JSON envelope (`{ statusCode, message, allMessages, timestamp, path }`).
- **Secrets:** never commit real values; use `YOUR_*` placeholders. Rotate immediately if a key leaks.
