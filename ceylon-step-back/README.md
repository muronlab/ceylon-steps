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

The backend is a **modular monolith** built on NestJS. It follows a strict **three-layer architecture** (Controller → Service → Prisma), with cross-cutting concerns handled by guards, pipes, filters, and middleware composed in a single bootstrap pipeline. There is no message broker, no microservice split, and no separate worker process — background work (mail send, audit log writes) happens in-request, with `EventEmitterModule` available for fire-and-forget hand-offs inside the same node.

### Architectural style

- **Modular monolith.** Each business capability (`auth`, `admin`, `partner/guide`, `partner/transport-provider`, `partner/applications`, `public`, `storage`, `mail`) is a self-contained Nest module with its own controllers, services, DTOs, and (where applicable) guards. The `AppModule` is the composition root that wires them together.
- **Layered within a module.** Every module obeys the same internal shape:
  - **Controller** — HTTP boundary. Owns route paths, Swagger decorators, auth/role decorators, DTO validation. Contains no business logic.
  - **Service** — domain logic + Prisma calls. Returns plain objects, raises `HttpException` subclasses on failure, writes `AuditLog` rows where required.
  - **DTOs** — request/response shape, validated by `class-validator` via the global `ValidationPipe`.
  - **Prisma** — the only data-access layer. There is no repository abstraction on top.
- **Shared kernel** under `common/` and `prisma/`: the global exception filter, CSRF controller, rate-limit guard + decorator, and the singleton `PrismaService`.

### Request pipeline

Every incoming HTTP request flows through the same pipeline, configured once in `src/bootstrap/setup-app.ts`:

```
HTTP request
  │
  ▼
helmet  ───────────────►  security headers
  │
  ▼
CORS  ─────────────────►  allow-listed origins, credentials: true
  │
  ▼
express-session  ──────►  cookie → t_sessions row (connect-pg-simple)
  │
  ▼
csurf (optional)  ─────►  CSRF token check for state-mutating verbs
  │
  ▼
SessionAuthGuard  ─────►  loads m_users row + roles onto req.user
  │
  ▼
RolesGuard (+ @Roles)  ►  RBAC: ADMIN / SUPER_ADMIN / GUIDE / TRANSPORT_PROVIDER
  │
  ▼
ValidationPipe  ───────►  whitelist + transform DTOs (class-validator)
  │
  ▼
Controller → Service → PrismaService → PostgreSQL
  │
  ▼
GlobalExceptionFilter  ►  unified JSON error shape
  │
  ▼
HTTP response
```

### Cross-cutting concerns

| Concern | Implementation | Where it lives |
| --- | --- | --- |
| Authentication | `SessionAuthGuard` — reads `req.session.userId`, hydrates the user with roles, checks `sessionInvalidBefore` for forced logout | `src/auth/guards/session-auth.guard.ts` |
| Authorisation | `RolesGuard` + `@Roles(...)` decorator — reads metadata via `Reflector`, intersects with the user's roles | `src/rbac/` |
| Input validation | Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) + per-DTO `class-validator` decorators | `bootstrap/setup-app.ts` + every `dto/` folder |
| Error handling | `GlobalExceptionFilter` — normalises `HttpException`, CSRF errors, and unhandled exceptions into one JSON envelope; logs the stack for 5xx | `src/common/filters/` |
| CSRF | `csurf` middleware, gated by `CSRF_ENABLED`; token issued by `CsrfController`, validated on every mutating verb | `bootstrap/setup-app.ts` + `src/common/csrf/` |
| Rate limiting | `RateLimitGuard` + `@RateLimit(...)` decorator, backed by `rate-limiter-flexible` (in-memory). Applied to OTP, login, password-reset endpoints | `src/common/rate-limit/` |
| Audit logging | Services write a `t_audit_logs` row inside the same Prisma transaction as the mutation | per-service |
| Eventing | `@nestjs/event-emitter` for in-process pub/sub (e.g. `user.registered` → send welcome mail) | `EventEmitterModule.forRoot()` in `app.module.ts` |
| Config | `@nestjs/config` with a `validateEnv` schema run at boot; missing/invalid env crashes the app fast | `src/config/` |

### Auth & session model

- **Stateful sessions, not JWTs.** Cookie-based; `connect-pg-simple` stores the session row in `t_sessions`. Sliding expiry (`rolling: true`), 7-day max age.
- **Passport** powers local + OAuth strategies (Google, Facebook, Apple) — registered conditionally based on env vars so missing credentials don't crash boot.
- **OTP** is a separate sub-module (`auth/otp/`) for password reset and email verification.
- **RBAC** is many-to-many: `m_users` ↔ `r_user_roles` ↔ `m_roles`. A user can be both `GUIDE` and `TRANSPORT_PROVIDER`. Role checks happen post-authentication.
- **Forced invalidation:** bumping `m_users.sessionInvalidBefore` retroactively kills every session issued before that timestamp.

### Persistence layer

- Single `PrismaService` (`OnModuleInit` opens the pool, `enableShutdownHooks` closes it cleanly).
- All migrations live in `prisma/migrations/`; production deploys use `prisma migrate deploy`.
- Multi-step mutations (apply + audit log, approve + create profile) run inside `prisma.$transaction(...)` so partial writes can't leak.
- No raw SQL except in the seeder and a handful of hand-written rename migrations.

### Integrations (anti-corruption boundaries)

Each external dependency is wrapped in a single service so the rest of the code stays unaware of the SDK:

| External | Wrapper | Purpose |
| --- | --- | --- |
| Supabase Storage | `StorageService` (`src/storage/`) | File uploads, returns the public URL the caller persists |
| SMTP | `MailService` (`src/mail/`) | Renders Handlebars templates, sends via nodemailer |
| Google / Facebook / Apple OAuth | Passport strategies under `src/auth/oauth/strategies/` | Token exchange, normalised into the same `AuthIdentity` shape |
| Postgres session store | `connect-pg-simple` | Session persistence (configured once in `setup-app.ts`) |

Swapping any of these (e.g. Supabase → S3) is a one-file change.

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
| Seed required data via raw SQL | `psql "$DATABASE_URL" -f ../scripts/script.sql` |

> [`../scripts/script.sql`](../scripts/script.sql) is the SQL equivalent of `pnpm db:seed` — idempotent (`ON CONFLICT DO NOTHING`) and safe to re-run. Use it when you don't have Node available (e.g. in a DBA-managed prod environment) or when bootstrapping a fresh database before the Nest app boots.
