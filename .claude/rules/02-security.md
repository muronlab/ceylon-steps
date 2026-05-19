# Security rules

Ceylon Step holds NIC numbers, government licences, contact emails, and (eventually) payment metadata. Sri Lanka PDPA applies. Treat every change as security-relevant until proven otherwise.

## Secrets and PII

- **Never** log: passwords, password hashes, session IDs, OTP codes, raw NIC numbers, full email addresses in error paths, API tokens, Supabase service keys, OAuth client secrets.
- **Never** include real values in code, comments, examples, or markdown. Use `YOUR_*` placeholders.
- If a secret appears in a user message or file, tell the user to **rotate immediately** and refuse to repeat it.
- `.env*` files are gitignored. If you see one tracked, flag it.

## Authentication

- Sessions are cookie-based. Cookies are `httpOnly`, `sameSite: lax` (or `strict`), and `secure: true` in production. Do not weaken these defaults.
- Passwords are hashed with **argon2** only. Never bcrypt, never sha-anything, never plain.
- `SessionAuthGuard` is the only acceptable way to authenticate a request. Do not bypass with custom middleware.
- `m_users.sessionInvalidBefore` is the kill switch — when an admin disables a user or a user changes their password, bump this so existing sessions are invalidated.
- OAuth providers are registered conditionally based on env vars. Missing credentials must not crash boot.

## Authorisation (RBAC)

- Role checks via `@Roles(...)` + `RolesGuard`. Never check `req.user.roles` by hand in a controller.
- Roles are `USER`, `ADMIN`, `SUPER_ADMIN`, `GUIDE`, `TRANSPORT_PROVIDER`. A user can hold many.
- `ADMIN` and `SUPER_ADMIN` routes live under `/admin/*`. Owner-scoped partner routes live under `/partner/*` and **must** verify the resource's `userId` matches the session user — having the right role is not enough; you also need to own the resource.

## Input validation

- Every controller input passes through a `class-validator` DTO. No untyped query params, no raw body parsing.
- `ValidationPipe` is configured with `whitelist: true, forbidNonWhitelisted: true` — unknown fields are stripped, not silently accepted.
- File uploads (`/storage/upload`) must validate MIME type and size on the server. Never trust the client-provided `path`; sanitise it and reject path traversal (`..`, leading `/`, absolute paths).
- For public listings, **never** return KYC fields: `nicNumber`, `nicFrontUrl`, `nicBackUrl`, `guideLicenseFrontUrl`, `guideLicenseBackUrl`, `safariJeepLicenseUrl`, `brdDocumentUrl`. The public DTO is a strict subset of the model.

## CSRF

- `csurf` middleware is enabled outside test. State-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) carry the `x-csrf-token` header.
- The frontend api-client reads the token from the CSRF endpoint on boot and attaches it to every mutating request. Do not disable CSRF as a "fix" for a 403 — debug the token flow.

## Rate limiting

- All auth-facing endpoints (login, signup, OTP request, OTP verify, password reset) are guarded by `RateLimitGuard` + `@RateLimit(...)`. Per-IP and per-email buckets.
- New auth-flavoured endpoints inherit this requirement. Adding a "resend code" or "change email" route without rate limiting is a security bug.

## Audit logging

- Any mutation that touches `m_users`, `t_guide_applications`, `t_transport_provider_applications`, `m_guide_profiles`, `m_transport_provider_profiles`, role assignments, or status transitions writes an `AuditLog` row **inside the same transaction**.
- Audit rows record: `action`, `userId` (actor), `ip`, `userAgent`. Do not store PII in `action` strings.

## SQL and Prisma

- Use Prisma's query builder exclusively. **Never** interpolate user input into `prisma.$queryRawUnsafe(...)` — use `prisma.$queryRaw\`...\`` tagged templates only when you must, with parameter binding.
- Indexes on hot lookup paths (`@@index([email])`, `@@index([userId])`, etc.) are part of the schema. Adding a new query pattern ⇒ check whether an index is needed.

## File uploads

- `StorageService.uploadFile` is the only path to Supabase Storage. Never expose the service key to the browser.
- Returned public URLs are persisted on the relevant model. Do not store the file blob in Postgres.
- The `path` form field is server-controlled per route (e.g. `guides/{userId}/profile/{uuid}.jpg`). Reject client-supplied paths.

## CORS

- Allow-list is explicit in `bootstrap/setup-app.ts`. `credentials: true` because of cookie sessions. **Never** add `*` as an origin.
- New frontend origin ⇒ add it to the allow-list **and** verify the cookie domain (`SESSION_COOKIE_DOMAIN`) matches.

## Headers

- `helmet` is enabled. Do not weaken its defaults without a documented reason.
- API responses should not set `Access-Control-Allow-Origin: *`. `helmet` + `cors` middleware handle this correctly when configured.
