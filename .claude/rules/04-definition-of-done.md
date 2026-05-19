# Definition of done

A change is **done** when every box below is checked. "It compiles" is not done. "Tests pass locally" is not done. Use this list before saying the work is finished.

## For every change

- [ ] **Type-check passes** in every project the change touches (`pnpm tsc --noEmit` or `pnpm build`).
- [ ] **Lint passes** (`pnpm lint`) — no new warnings, no `// eslint-disable` without a reason in a comment.
- [ ] **Tests pass** (`pnpm test`) and **new behaviour has tests** (unit for services, e2e for HTTP contracts).
- [ ] **No `console.log`, no `TODO` without an owner**, no commented-out blocks.
- [ ] **No `any`** unless there is a comment explaining why a precise type is impossible.
- [ ] **Conventions match the surrounding code.** Same DTO style, same service shape, same axios pattern.

## For backend changes

- [ ] Controller has `@ApiOperation`, `@ApiBody` / `@ApiResponse`, `@ApiCookieAuth` (if authenticated), and the right `@UseGuards` / `@Roles` decorators.
- [ ] DTO uses `class-validator` decorators — no untyped inputs.
- [ ] Service throws `HttpException` subclasses, not generic `Error`.
- [ ] Multi-step writes are inside `prisma.$transaction(...)`.
- [ ] Audit log row written for any mutation to `m_users`, applications, profiles, or role assignments.
- [ ] Public response DTOs filter out KYC fields (`nic*`, `*licenseUrl*`, `brd*`).
- [ ] If a new env var was added, it is documented in [`ceylon-step-back/README.md`](../../ceylon-step-back/README.md) and (if reference data is needed) in [`scripts/script.sql`](../../scripts/script.sql).
- [ ] Prisma migration generated, reviewed, and committed alongside the code.
- [ ] Swagger UI shows the new / changed endpoint correctly at `http://localhost:3000/api/docs`.

## For frontend changes

- [ ] No direct `fetch(...)` to the backend — go through the api-client.
- [ ] Server components by default; `'use client'` only when there is a real reason.
- [ ] Response types under `interfaces/` (front) or `types/` (admin) mirror the backend DTO exactly.
- [ ] Forms surface API field errors using the unified error envelope (`allMessages` or `message`).
- [ ] UI tested in a browser — golden path **and** at least one error path (validation failure, 401, 403).
- [ ] No new shadcn primitive copy-pasted from elsewhere; extend via `cva` or add the canonical component via the shadcn CLI.

## For cross-project changes

See [03-cross-project-consistency.md](03-cross-project-consistency.md). Specifically:

- [ ] Both frontends updated where the change is observable.
- [ ] Ripgrep both frontends for removed symbols — zero hits.
- [ ] Root [README.md](../../README.md) updated if a new top-level concept was introduced.

## When you are tempted to skip

If you find yourself about to:

- Disable a hook with `--no-verify`,
- Cast through `as unknown as`,
- Set `whitelist: false` or remove a guard,
- Add a route that bypasses `SessionAuthGuard`,
- Catch and swallow an exception,
- Stub out a test with `expect(true).toBe(true)`,

**stop** and surface it to the user. There is almost always a real fix that doesn't require any of these.

## When you cannot test something

If a change cannot be verified locally (e.g. it depends on a Supabase bucket, OAuth credentials, or production data), say so explicitly. Do not claim success based on `tsc` alone — type-checking proves code compiles, not that it works.
