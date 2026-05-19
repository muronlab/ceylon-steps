# Architecture rules

## Backend (`ceylon-step-back`)

### Three-layer architecture — no exceptions

Every request flows: **Controller → Service → PrismaService → PostgreSQL**.

- **Controllers** own the HTTP boundary. They have route decorators, Swagger decorators (`@ApiOperation`, `@ApiBody`, `@ApiCookieAuth`), auth/role decorators (`@UseGuards`, `@Roles`), and DTO validation. **No business logic.** No Prisma calls. No conditionals beyond extracting the user from the request.
- **Services** own domain logic and persistence. They take primitives/DTOs in, return plain objects, throw `HttpException` subclasses on failure, and call Prisma. Multi-step mutations use `prisma.$transaction(...)`.
- **Prisma** is the only data-access layer. Do not introduce a repository pattern on top — it adds ceremony with no benefit at this scale.

### Modules

Every business capability is its own Nest module under `src/<capability>/` with its own controller, service, DTOs, and (where applicable) guards. New capability ⇒ new module ⇒ wire it into `AppModule`. Do not pile unrelated controllers into existing modules.

### DTOs

- Every request body, query, and response shape has a DTO class in a `dto/` folder beside the controller.
- DTOs use `class-validator` decorators. The global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`) enforces them.
- Never accept `any` or untyped objects from the wire.
- Response DTOs filter out KYC fields (NIC numbers, license URLs) on public endpoints — see [02-security.md](02-security.md).

### Errors

- Throw `HttpException` subclasses (`NotFoundException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`, `ConflictException`). The `GlobalExceptionFilter` produces the unified JSON envelope.
- Never call `res.status(...).json(...)` directly — it bypasses the filter and produces inconsistent shapes.
- Error messages are user-facing strings. No stack traces, no internal IDs, no SQL fragments.

### External integrations

Every external dependency (Supabase, SMTP, OAuth providers, payment gateways, etc.) lives behind a single wrapper service. The rest of the code never imports the vendor SDK directly. This is an anti-corruption boundary — swapping the vendor must be a one-file change.

### Database

- Table prefixes via `@@map`: `m_*` master, `t_*` transactional, `r_*` reference / junction. Application code uses PascalCase Prisma model names.
- Multi-step writes go inside `prisma.$transaction(...)`. Anything that produces an `AuditLog` row must include the audit write in the same transaction as the mutation it audits.
- Manual SQL migrations are allowed when Prisma's auto-diff would `DROP + CREATE` instead of `RENAME`. Read every migration's SQL before applying in production.

## Frontends (`ceylon-steps-front`, `ceylon-steps-admin`)

### Read AGENTS.md first

Both frontends ship with an `AGENTS.md` warning that **Next.js 16 has breaking changes** from older versions. Read `node_modules/next/dist/docs/` before writing new patterns.

### Server components by default

App Router pages are server components unless they need client state, browser APIs, or event handlers. Mark client components with `'use client'` only when necessary.

### Single API-client layer

- Public site: `ceylon-steps-front/services/api-client.ts` (or `lib/api-client.ts`).
- Admin: `ceylon-steps-admin/lib/api-client.ts`.

All network calls go through the axios instance configured there. It carries `withCredentials: true` (session cookie) and the CSRF header. **Never** call `fetch` directly to the backend from a component.

### Typed responses

Every API call has a TypeScript interface for its response under `interfaces/` or `types/`. Do not type API responses as `any`. The shapes mirror backend DTOs — see [03-cross-project-consistency.md](03-cross-project-consistency.md) for the synchronisation rule.

### UI primitives

Both frontends use shadcn/ui + Tailwind 4. New primitives go through the shadcn CLI; do not hand-roll variants of existing components. Custom variants extend the shadcn component via `cva`, not by copy-pasting.

### Forms

- DTOs from the backend define the shape; the form mirrors it field-for-field.
- Validate client-side for UX, but trust the server's validation as the source of truth — re-render API field errors via the unified error envelope.
