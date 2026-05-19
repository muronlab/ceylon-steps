# Cross-project consistency

**The backend is the contract.** Every shape, route, enum, error code, and auth rule lives in `ceylon-step-back` first. Both frontends must reflect that contract — they are not independent codebases.

> A backend change that doesn't touch the relevant frontend code is an incomplete change. Do not declare a task done until both ends agree.

## When to update what

| Backend change | `ceylon-steps-front` | `ceylon-steps-admin` |
| --- | --- | --- |
| New route under `/api/v1/...` | Add a typed client method in `services/api-client.ts` (or the matching service file) **only if the public site or partner area consumes it**. | Add a typed client method in `lib/api-client.ts` **only if the admin console consumes it**. |
| Removed or renamed route | Remove or rename the matching client method **in every frontend that referenced it**. Search across both repos. | Same — and any UI calling the removed method must be migrated, not silently left broken. |
| New request DTO field (required) | Add to the form, the request type, and any default-value logic. Validate client-side. | Same. |
| New request DTO field (optional) | Add to the request type. Add to the form **only if the UX needs it**. | Same. |
| New response DTO field | Add to the response interface under `interfaces/` (front) or `types/` (admin). Surface it in the UI if it's user-facing. | Same — admin almost always surfaces new fields, since the admin console is the diagnostic view of partner data. |
| Removed response field | Remove from the interface. Remove every UI reference. TypeScript will tell you where. | Same. |
| New / renamed Prisma enum value | Add to the matching TypeScript union in `interfaces/` or `types/`. Update any switch/match, badge colour map, or filter dropdown. | Same. |
| New role (`@Roles(...)`) | Update the auth/role-aware UI (e.g. nav items, "apply as X" CTAs). | Update the role guard in `app/(dashboard)/layout.tsx` if the new role should access admin. |
| Changed error envelope shape | Update the axios interceptor / error handler so toasts, field-error binding, and 401-redirect still work. | Same. |
| New required env var | Update `.env.example`, document in [`ceylon-step-back/README.md`](../../ceylon-step-back/README.md). Add a matching `NEXT_PUBLIC_*` only if the frontend genuinely needs it (most are server-only). | Same. |
| Cookie / session config change (`SESSION_COOKIE_*`, CORS allow-list) | Verify `withCredentials: true` still works locally. Update the CORS allow-list in `bootstrap/setup-app.ts` if a new frontend origin is involved. | Same. |
| CSRF behaviour change | Verify the api-client still fetches and attaches the token. | Same. |
| New role-gated endpoint | If the UI should hide the action when the user lacks the role, update the auth-aware component / hook. | Same — admin commonly hides cards/buttons by role. |
| New file-upload endpoint | Update the upload helper (front: `lib/upload.ts`; admin: equivalent) to call it with the right `path`. | Same. |
| New webhook / event consumer | Document in backend README. Frontends usually do not change. | Same. |

## How to find affected frontend code

Before declaring a backend change done, search **both** frontend repos for:

1. The old route string (e.g. `/api/v1/partner/guide-profile`) — case-sensitive.
2. The old DTO/type name (e.g. `GuideProfileResponse`, `TransportProviderType`).
3. The old enum literal (e.g. `'SAFARI_JEEP'`, `'VEHICLE_FLEET'`).
4. The old method name in the api-client.

A clean ripgrep across `ceylon-steps-front/` and `ceylon-steps-admin/` should return **zero** matches for removed symbols.

## Migration discipline

- **Prisma migration** is part of the same PR as the code that depends on it. Never merge a code change that assumes a column that doesn't exist yet.
- **Breaking API changes** (route rename, field removal, enum value rename) require both frontends updated in the same PR. There is no "v2 endpoint and we'll migrate later" — we control both ends, so we migrate.
- **Additive API changes** (new optional field, new route) can ship without frontend changes, but the frontend code that *would* surface the new field should be tracked as follow-up work.

## Swagger is the source of truth at runtime

After any backend route change, the Swagger UI at `http://localhost:3000/api/docs` must reflect it. The frontend's typed client is a hand-maintained mirror — there is no codegen yet. Drift between Swagger and the frontend types is a bug.

## Naming consistency

The same concept must use the same name across all three projects.

- A guide application is `GuideApplication` everywhere — not `GuideForm`, `GuideRequest`, or `GuideSubmission`.
- A transport-provider type is `TransportProviderType` with values `SAFARI_JEEP` / `VEHICLE_WITH_DRIVER` / `VEHICLE_FLEET` — not `safariJeep`, `provider_type`, or `kind`.
- Database table prefix conventions (`m_*` / `t_*` / `r_*`) stay in the database. Application code uses PascalCase Prisma model names.

When in doubt, **match the backend**.

## The cross-project checklist

Use this before declaring a backend change complete:

- [ ] Backend code, DTOs, controllers, services updated.
- [ ] Prisma schema + migration committed.
- [ ] Swagger decorators updated (try the route in `/api/docs`).
- [ ] `ceylon-steps-front` — api-client method, types, forms, UI all updated where relevant.
- [ ] `ceylon-steps-admin` — api-client method, types, tables, detail views all updated where relevant.
- [ ] Ripgrep both frontends for any removed symbols — should return zero hits.
- [ ] Root [README.md](../../README.md) updated if a new env var, port, or top-level concept was introduced.
- [ ] Backend [README.md](../../ceylon-step-back/README.md) updated if a route prefix or architecture detail changed.
