# Ceylon Step — Backend (`ceylon-step-back`)

NestJS + Prisma + PostgreSQL API that powers the Ceylon Step traveler / guide / transport-provider platform. Serves both the public marketing site (`ceylon-steps-front`) and the admin dashboard (`ceylon-steps-admin`).

## Stack

| Layer | Library | Version |
| --- | --- | --- |
| Runtime | Node.js | 20.x (LTS) recommended |
| Framework | NestJS | 11.x |
| Language | TypeScript | 5.7 |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 14+ |
| Auth | Passport + session cookies | passport 0.7, express-session 1.18, connect-pg-simple 10 |
| Password hashing | argon2 | 0.44 |
| Validation | class-validator + class-transformer | 0.15 / 0.5 |
| File storage | Supabase Storage | @supabase/supabase-js 2.x |
| API docs | Swagger (OpenAPI 3) | @nestjs/swagger 11 |
| Mail | nodemailer + handlebars | 7 / 4 |
| Rate limiting | rate-limiter-flexible | 11 |

## Prerequisites

- Node.js 20+
- pnpm (preferred — `package.json` has pnpm-specific build hooks)
- A running PostgreSQL 14+ instance
- A Supabase project for file storage (or compatible S3 alternative — see `src/storage`)

## Setup

```bash
# 1. Install deps
pnpm install

# 2. Configure env
cp .env.example .env   # then edit values below

# 3. Apply schema + generate Prisma client
pnpm prisma:migrate
pnpm prisma:generate

# 4. Seed the dev DB (roles, super-admin)
pnpm db:seed

# 5. Run the API
pnpm start:dev
```

### Required environment variables

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string used by Prisma + connect-pg-simple |
| `SESSION_SECRET` | Cookie signing secret |
| `SESSION_COOKIE_NAME` | Defaults to `sid` |
| `SESSION_COOKIE_SECURE` | `true` in production (HTTPS only) |
| `SESSION_COOKIE_SAMESITE` | `lax` / `strict` / `none` |
| `SESSION_COOKIE_DOMAIN` | Set when frontends are on a different subdomain |
| `CSRF_ENABLED` | `true` outside test |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET` | File uploads |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | Outgoing email (OTP, notifications) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook OAuth (optional) |
| `APPLE_*` | Apple sign-in (optional) |
| `NODE_ENV` | `development` / `production` / `test` |

> Never commit real secrets. Use `YOUR_*` placeholders in examples and rotate any leaked key immediately.

## Running

```bash
pnpm start:dev   # watch mode (default)
pnpm start       # one-shot
pnpm start:prod  # serves the compiled output in dist/
pnpm build       # compile to dist/
pnpm test        # unit tests (Jest)
pnpm test:e2e    # supertest e2e suite
pnpm lint
```

After boot, the API is at `http://localhost:3000/api/v1`.

## API documentation

Swagger UI is auto-generated from controller decorators and served at:

```
http://localhost:3000/api/docs
```

Every endpoint carries `@ApiOperation`, `@ApiBody`, and `@ApiCookieAuth` decorators so the docs stay in sync with the code. Use the Swagger "Try it out" panel for interactive testing while developing.

### Route prefixes

All routes are mounted under `/api/v1`. Top-level groups:

| Prefix | Purpose |
| --- | --- |
| `/auth/*` | Login, logout, signup, OTP, password reset, OAuth callbacks |
| `/sessions/*` | Current user / role introspection |
| `/admin/*` | Admin-only endpoints (guides, transport providers, users) |
| `/partner/applications/*` | Aggregated application queues for admins |
| `/partner/guide/*` | Guide-side endpoints (apply, manage profile) |
| `/partner/guide-profile/*` | Guide profile editor |
| `/partner/transport-provider/*` | Transport-provider apply + profile + vehicles + safari jeeps + driver services + itineraries + type-change requests |
| `/public/*` | Unauthenticated read-only endpoints used by the marketing site |
| `/storage/*` | File upload endpoint (multipart, returns the stored URL) |

### Auth model

- Cookie-based sessions backed by `connect-pg-simple` (table `t_sessions`).
- `SessionAuthGuard` checks the cookie; `RolesGuard` + `@Roles(...)` decorator gate by role.
- RBAC roles: `ADMIN`, `SUPER_ADMIN`, `GUIDE`, `TRANSPORT_PROVIDER`. A user can hold multiple.
- CSRF tokens issued via `csurf` for state-mutating requests (toggle with `CSRF_ENABLED`).

## Architecture

```
src/
├─ main.ts                  # bootstrap (calls setupApp + listens)
├─ app.module.ts            # composition root
├─ bootstrap/
│   └─ setup-app.ts         # CORS, helmet, sessions, CSRF, global filter, validation pipe
├─ common/
│   └─ filters/             # GlobalExceptionFilter unifies error shape
├─ config/                  # @nestjs/config schema + accessors
├─ prisma/
│   ├─ prisma.service.ts    # singleton PrismaClient
│   ├─ prisma.module.ts
│   └─ seed.ts              # `pnpm db:seed`
├─ auth/                    # local + OAuth strategies, guards, decorators, controllers
├─ rbac/                    # RolesGuard + @Roles decorator
├─ sessions/                # /sessions/me + role helpers
├─ mail/                    # nodemailer + handlebars templates
├─ storage/                 # Supabase upload service (StorageService.uploadFile)
├─ admin/                   # admin-only modules (users, guides, transport providers)
├─ partner/                 # partner self-service: applications, guide, transport-provider
│   └─ transport-provider/  # apply, profile, vehicles, safari jeeps, driver services,
│                           # itineraries, type-change requests
└─ public/                  # unauthenticated read endpoints (guide listings, etc.)
```

### Database conventions

The DB uses an industrial table-naming convention enforced via Prisma's `@@map`:

- `m_*` — **master** entities (`m_users`, `m_guide_profiles`, `m_transport_vehicles`, `m_safari_jeeps`, `m_itineraries`, …)
- `t_*` — **transactional** records (`t_guide_applications`, `t_transport_provider_applications`, `t_audit_logs`, `t_sessions`, `t_otp_codes`, `t_transport_type_change_requests`, …)
- `r_*` — **reference / junction** tables (`r_user_roles`, `r_auth_identities`)

Application code continues to reference Prisma model names (PascalCase) — only the physical table names carry the prefix.

### Itineraries

`Itinerary` is the common itinerary entity. It can be owned by either a `GuideProfile` (`guideProfileId`) or a `SafariJeep` (`safariJeepId`); a CHECK constraint enforces exactly one. Safari operators get a "create itinerary from this jeep" endpoint that snapshots the jeep's cover, gallery, charges, and inclusions into a fresh itinerary draft.

### Type-change requests

Transport providers cannot change `providerType` directly. They submit a `TransportProviderTypeChangeRequest` with required documents (e.g. safari licence when switching to `SAFARI_JEEP`); admin approves/rejects via `/partner/transport-provider/type-change-requests/:id/status`.

### File uploads

Multipart files go through `POST /api/v1/storage/upload` with `path` + `file` form fields. `StorageService` pushes them to Supabase Storage and returns the public URL, which the calling endpoint persists.

## Migrations

```bash
# Generate + apply a new migration in dev
npx prisma migrate dev --name <descriptive_name>

# Apply pending migrations (CI / prod)
npx prisma migrate deploy

# View current state
npx prisma migrate status
```

Migrations live in `prisma/migrations/`. Manual SQL migrations are sometimes hand-written (e.g. the rename + safari-simplify ones) when Prisma's auto-diff would DROP + CREATE instead of RENAME. Check each migration's SQL before applying in production.

## Testing

```bash
pnpm test           # unit specs (*.spec.ts under src/)
pnpm test:watch
pnpm test:cov       # coverage
pnpm test:e2e       # test/jest-e2e.json — supertest against the Nest app
```

## Conventions

- DTOs in `dto/` subfolders next to controllers; validated with `class-validator`.
- Services return Prisma rows directly; controllers add `@ApiOperation` + auth decorators.
- Audit-worthy actions write an `AuditLog` row inside the same transaction.
- Errors flow through `GlobalExceptionFilter` which produces a consistent JSON shape:
  ```json
  {
    "statusCode": 404,
    "message": "Transport application not found",
    "allMessages": ["Transport application not found"],
    "timestamp": "2026-05-20T10:30:00.000Z",
    "path": "/api/v1/partner/transport-provider/foo"
  }
  ```

## Common tasks

| Task | Command |
| --- | --- |
| Open Prisma Studio (DB GUI) | `pnpm prisma:studio` |
| Reset dev DB + reseed | `npx prisma migrate reset && pnpm db:seed` |
| Add a migration without applying | `npx prisma migrate dev --create-only --name <x>` |
| Regenerate Prisma client | `pnpm prisma:generate` |
