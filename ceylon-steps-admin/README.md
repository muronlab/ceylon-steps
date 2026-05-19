# Ceylon Step — Admin dashboard (`ceylon-steps-admin`)

Internal admin console for the Ceylon Step platform. Reviews guide and transport-provider applications, manages users, approves provider-type-change requests, and inspects the full data of every approved partner (profile + vehicles + safari jeeps + driver services + itineraries).

Runs on **port 3001** by default. Pairs with the backend API (`ceylon-step-back`) and the public site (`ceylon-steps-front`).

## Stack

| Layer | Library | Version |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.x |
| React | react / react-dom | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI primitives | shadcn/ui + `@base-ui/react` | 4.x / 1.x |
| Icons | lucide-react, `@hugeicons/react` | latest |
| Data tables | @tanstack/react-table | 8.x |
| HTTP client | axios | 1.x |
| Carousel | embla-carousel-react | 8.x |
| Date pickers | date-fns | 4.x |
| OTP input | input-otp | 1.x |

## Prerequisites

- Node.js 20+
- pnpm
- The backend (`ceylon-step-back`) running locally on `http://localhost:3000`

## Setup

```bash
pnpm install
cp .env.example .env.local   # then edit
pnpm dev
```

Open `http://localhost:3001`.

### Environment variables

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base, e.g. `http://localhost:3000/api/v1`. Used by `lib/api-client.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for OAuth redirects. |

Only `ADMIN` and `SUPER_ADMIN` roles can sign into this app — the role guard in `app/(dashboard)/layout.tsx` redirects everyone else.

## Scripts

```bash
pnpm dev      # next dev -p 3001
pnpm build    # production build
pnpm start    # next start -p 3001
pnpm lint
```

## Project layout

```
app/
├─ (auth)/              # admin login screen
├─ (dashboard)/         # role-guarded admin pages
│   ├─ layout.tsx       # sidebar + topbar + admin guard
│   ├─ users/           # user management
│   ├─ guides/
│   │   ├─ applications/  # guide application review (approve/reject)
│   │   └─ page.tsx       # approved guides list
│   └─ transport/
│       ├─ applications/         # transport application review
│       ├─ type-change-requests/ # provider type-change approvals
│       ├─ transport-provider-detail-sheet.tsx
│       │                        # full provider detail (profile, vehicles,
│       │                        # safari jeeps, services, type changes,
│       │                        # original application + status history)
│       └─ transport-providers-table.tsx
components/
├─ nav/                 # sidebar with pending-counts badges
├─ user-profile/        # topbar / avatar menu
└─ ui/                  # shadcn primitives
lib/
├─ api-client.ts                       # axios instance (withCredentials + CSRF)
├─ auth-server.ts                      # server-side session helpers
├─ auth-client.ts
├─ admin-api.ts                        # /sessions/me etc.
├─ admin-guides-api.ts
├─ admin-transport-providers-api.ts    # list/detail/admin-enabled toggle
├─ guide-applications-api.ts           # list + review
├─ transport-applications-api.ts       # list + review + type-change-requests
└─ pending-counts-api.ts               # sidebar badge counts + change events
hooks/
└─ use-pending-counts.ts
```

### Auth

The admin app shares the same cookie session as the partner site. `lib/auth-server.ts` reads the session on the server, and `app/(dashboard)/layout.tsx` redirects to `/login` when the user isn't an `ADMIN` / `SUPER_ADMIN`. The login screen calls the same `/auth/login` endpoint as the public site; the role guard then determines which app the user can access.

### Sidebar + pending counts

`components/nav/app-sidebar.tsx` renders the three top-level groups (Users, Manage Guides, Manage Transport). Each child item can show a pending-count badge — these come from `/sessions/pending-counts` via the `usePendingCounts` hook. When a child review action moves a row off `PENDING`, it dispatches a `PENDING_COUNTS_CHANGED_EVENT` so other tables refresh.

### Review pattern

All review sheets follow the same shape:

```tsx
{canAct && (
  <>
    <Button onClick={approve} className="bg-emerald-600 …">Approve</Button>
    <Button onClick={() => setRejectOpen(true)} className="bg-red-600 …">Reject</Button>
  </>
)}

<Dialog open={rejectOpen} …>
  <Textarea value={remark} onChange={…} />
  <Button onClick={reject} disabled={!remark.trim()}>Reject request</Button>
</Dialog>
```

Approving a transport application creates the `TransportProviderProfile` row and grants `TRANSPORT_PROVIDER` role. Approving a type-change request flips `providerType` on the profile and carries over any newly uploaded documents.

### Transport provider detail sheet

`app/(dashboard)/transport/transport-provider-detail-sheet.tsx` is the deepest view in the app. It shows:

- Header card (name, provider type, listed/hidden state)
- Public listing (admin visibility toggle + owner visibility readout)
- Owner account, contact, business
- KYC documents (NIC, safari licence, BRD) with in-app viewer for images / PDFs
- **Vehicles** — cards with cover, plate, fuel/condition, charges, facilities, inclusions
- **Safari jeeps** — cards with driver photo + bio + experience, national parks, experiences, charges (incl. park-fee flag)
- **Driver services** — cards with cover, category, price, inclusions
- **Type change requests** — running history of provider type flips
- Original application + status history

The backend's `DETAIL_INCLUDE` returns all of the above in a single response.

### Path aliases

Configured in `tsconfig.json`:

```ts
"@/*": ["./*"]
```

## Conventions

- Use `axios` via `lib/api-client.ts`, never raw `fetch`.
- Tables use `@tanstack/react-table` patterns from existing `*-table.tsx` files; status filter buttons go top-left, search top-left, total count top-right.
- Sheets (`Sheet` from shadcn) for detail views; `Dialog` for confirmations.
- Approve buttons emerald, reject buttons red, with the in-flight state on the click handler.
- No emojis in UI — Lucide icons only.

## Notes

- Next.js 16 + React 19. App Router everywhere.
- The admin app does **not** have its own DB — it reads/writes through the backend at `/api/v1/...` like a normal client.
- Two-column layouts above `xl` are common; collapse to one column on smaller screens.
