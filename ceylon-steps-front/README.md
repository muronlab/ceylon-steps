# Ceylon Step — Public site & partner dashboard (`ceylon-steps-front`)

The traveler-facing site for Ceylon Step plus the partner self-service area where guides, transport providers, safari operators, and drivers manage their public profiles, vehicles, safari jeeps, services, and itineraries.

Runs on **port 3000** by default. Pairs with the backend API (`ceylon-step-back`) and the admin dashboard (`ceylon-steps-admin`).

## Stack

| Layer | Library | Version |
| --- | --- | --- |
| Framework | Next.js (App Router, Webpack) | 16.x |
| React | react / react-dom | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI primitives | shadcn/ui (Radix under the hood) + `radix-ui` | 4.x / 1.x |
| Icons | lucide-react, @tabler/icons-react | latest |
| Rich-text editor | Tiptap (StarterKit, Link, Placeholder, Underline, TextAlign) | 3.x |
| Forms / validation | inline (no react-hook-form yet) | — |
| HTTP client | axios | 1.x |
| Animation | framer-motion / motion | 12.x |
| Data tables | @tanstack/react-table | 8.x |
| Charts | recharts | 3.x |
| Carousel | embla-carousel-react | 8.x |
| OTP input | input-otp | 1.x |
| Notifications | sonner | 2.x |
| Date pickers | react-day-picker, date-fns | 10.x / 4.x |

> The repo has `prisma` / `@prisma/client` in `package.json` for legacy reasons; the frontend does **not** talk to the DB directly — all data flows through the backend at `/api/v1/...`.

## Prerequisites

- Node.js 20+
- pnpm
- The backend (`ceylon-step-back`) running locally on `http://localhost:3000` (or wherever `NEXT_PUBLIC_API_BASE_URL` points)

## Setup

```bash
pnpm install
cp .env.example .env.local   # then edit
pnpm dev
```

Open `http://localhost:3000`.

### Environment variables

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base, e.g. `http://localhost:3000/api/v1`. Used by `services/api-client.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for OAuth redirects and emailed links. |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Used if/when the optional next-auth wiring is enabled. |

> All public env vars start with `NEXT_PUBLIC_`. Server-only secrets must NOT carry that prefix.

## Scripts

```bash
pnpm dev      # next dev --webpack
pnpm build    # production build
pnpm start    # serve build
pnpm lint
```

## Project layout

```
app/
├─ (auth)/              # login, signup, OTP, password reset
├─ (app)/               # public site (landing, guides listing, guide detail, transport)
├─ profile/
│   ├─ layout.tsx       # sidebar + topbar for the partner dashboard
│   ├─ guide/           # guide profile editor (bio, gallery, itineraries, languages, rates)
│   ├─ transport/       # transport-provider dashboard (profile, vehicles, safari jeeps,
│   │                   # driver services, type-change requests)
│   └─ chats/           # WIP chat UI
components/
├─ ui/                  # shadcn primitives
├─ guides/              # public guide cards, itinerary cards
├─ navbar/              # public site nav
└─ chat/, user-profile/, …
services/               # axios clients, one per backend module
├─ api-client.ts                       # base axios instance (withCredentials + CSRF)
├─ guide-profile.service.ts
├─ guide-itineraries.service.ts
├─ transport-provider.service.ts
├─ transport-vehicles.service.ts
├─ safari-jeeps.service.ts
├─ driver-services.service.ts
└─ public-guides.service.ts
context/                # auth context, etc.
data/
└─ languages.json       # curated language list used by the language picker
hooks/
lib/                    # cn(), small helpers
```

### Sessions + CSRF

The backend uses cookie sessions. `services/api-client.ts` calls axios with `withCredentials: true`, and on first 4xx CSRF error it refetches a token from `/auth/csrf-token` and retries. Don't bypass this client — every API call should go through it.

### Rich text

The itinerary day editor + bio editor + service description editor all use Tiptap. Two custom editors live in `app/profile/`:

- `guide/sections/rich-bio-editor.tsx` — full bio editor with sample template insert.
- `profile/transport/vehicle-description-editor.tsx` — vehicle / rental description with the rental-listing template.

Both store the editor's HTML in a string field on the row.

### Partner dashboard sections

- **Guide** (`/profile/guide`): bio, languages, gallery, hourly + daily rates, itineraries (per-day or per-time-slot with rich descriptions).
- **Transport** (`/profile/transport`):
  - Profile, contact, business
  - **Provider type change** — request flow with admin approval; uploads safari licence / BRD documents when needed
  - **Fleet (VEHICLE_FLEET)** — unlimited vehicles with photos, charges, inclusions, fuel policy, locations
  - **My vehicles (VEHICLE_WITH_DRIVER)** — max 2 vehicles, same editor
  - **Driver services (VEHICLE_WITH_DRIVER)** — airport pickups / day tours / round trips with pricing
  - **Safari jeeps (SAFARI_JEEP)** — jeep + driver inline; national parks; experiences; charges (per-jeep, per-person, etc.); driver photo logic (solo operators reuse provider profile photo)

The layout switches from 1-column (below `xl`) to 2-column (`xl+`); wide list sections span the full row.

### Path aliases

Configured in `tsconfig.json`:

```ts
"@/*": ["./*"]
```

So imports look like `import { … } from "@/services/transport-provider.service"`.

## Conventions

- Use `axios` via `services/api-client.ts`, never raw `fetch`.
- File uploads go through `POST /storage/upload` (multipart form with `file` + `path`); the response `{ url }` is then PATCHed to the parent profile.
- Forms manage their own state with `useState` — no react-hook-form yet (keep additions consistent with existing files).
- Match existing styling: Tailwind utility classes, `rounded-2xl` / `rounded-3xl` for surfaces, `ring-1 ring-zinc-200/70` for borders.
- Lucide icons only — no emojis in UI unless explicitly requested.
- British English by default (e.g. "tyre", "licence"); American English when user-facing copy demands it.

## Notes

- Next.js 16 (App Router) with the Webpack dev server (`next dev --webpack`). Turbopack is opt-in via `next.config`.
- React 19 — use new hooks (`use()`, `useActionState`) where they fit, but the codebase predates them.
- `node_modules/next/dist/docs/` contains the Next.js docs that ship with the version — consult those before reaching for older patterns.
