# Van Cortlandt Bench Adoption

*Leave your mark on the park.*

**Live application:** _(URL added after deployment — see bottom of this file)_

A small, complete web app that acts as a single source of truth for a park bench adoption program: which benches are adopted, by whom, for how long, and which are still available — plus a form to adopt an available bench.

Built as a take-home project for **Columbia Software Solutions** (Option 2: Bench Adoption Program). It is an **independent demonstration** and is not affiliated with Van Cortlandt Park, NYC Parks, or any conservancy. All 520 benches and every donor in it are fictional sample data. No payments are collected.

---

## Features

- **Bench directory** — all 520 benches, 18 per page, with live counts (total / adopted / available) computed from the database.
- **Search & filters** — search by bench number (`VC-042`, or just `42`) or park area; filter by *All / Available / Adopted* and by park area. State lives in the URL so results are shareable and back/forward work.
- **Bench detail page** — status, area, description, and for adopted benches the donor's recognition name (or "Anonymous Donor"), duration, and adoption period.
- **Adoption form** — name, email, optional public recognition name, an explicit consent checkbox, and a duration picker with a live "runs from … through …" summary. Submitting records the adoption and redirects to a confirmation page.
- **Immediate, shared updates** — after adopting, the bench shows as adopted for every visitor, in every browser, after a refresh.
- **Conflict prevention** — two visitors cannot both adopt the same bench (enforced in the database, not the UI).
- **Automatic expiry** — availability is computed from dates, so a bench whose adoption has ended is available again without anyone editing anything.
- **Privacy** — donor emails are never shown or returned to the browser; recognition names appear only with consent.
- **Graceful states** — loading, empty-search, not-found, and database-error states.
- **Accessible & responsive** — semantic HTML, labelled inputs, visible focus rings, status conveyed by icon + text (not color alone), works at phone widths.

## Technology stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | One codebase for UI and server logic. Server Components read the database directly; a Server Action handles the form. No separate API server to deploy. |
| Styling | **Tailwind CSS v4** + a few small shadcn-style components (`Button`, `Input`, `Select`, `Label`) | Fast to build, consistent, no runtime CSS-in-JS. Components are hand-written in `src/components/ui` rather than generated, to keep the dependency count low. |
| Icons | **Lucide** | Simple line icons. |
| Validation | **Zod** | One schema validates the form on the server; the database validates again. |
| Database | **Supabase (PostgreSQL)** | Free tier, real Postgres, and a SQL editor for running the schema/seed. The critical business rule lives in a Postgres function. |
| Hosting | **Vercel** | Zero-config Next.js hosting on the free tier. |
| Tests | **Vitest** | Unit tests for date arithmetic, validation, and search normalization; a script for the concurrency test. |

## Architecture

```
Browser ──(HTML / form POST)──▶ Next.js on Vercel ──(service-role key, server only)──▶ Supabase Postgres
                                  │
                                  ├─ Server Components  → read `benches_public` view (no emails in it)
                                  └─ Server Action      → call `adopt_bench()` (atomic, row-locked)
```

- **The browser never talks to Supabase.** There is no `NEXT_PUBLIC_` Supabase key. All reads and writes happen in server code using the service-role key, which stays in server-side environment variables.
- **Reads** go through a Postgres **view** (`benches_public`) that joins each bench to its *currently active* adoption and exposes only public columns.
- **Writes** go through exactly one path: a Postgres **function** (`adopt_bench`) called from one Server Action.
- Row Level Security is enabled on both tables with no public policies, and privileges are revoked from the `anon`/`authenticated` roles, so even someone with the project's public (anon) key gets nothing.

### Key files

| File | Purpose |
|---|---|
| `supabase/schema.sql` | Tables, view, `adopt_bench()` function, security grants. Idempotent. |
| `supabase/seed.sql` | Generates 520 fictional benches and ~180 fictional adoption records. Idempotent. |
| `src/lib/benches.ts` | All database reads (directory listing, bench detail, stats, confirmation receipt). |
| `src/app/actions.ts` | The Server Action behind the adoption form: honeypot, rate limit, Zod validation, `adopt_bench` RPC, redirect. |
| `src/lib/validation.ts` | Zod schema for the adoption form. |
| `src/lib/dates.ts` | Calendar-month arithmetic, "park today" (New York date), active-adoption rule, formatting. |
| `src/lib/supabase/admin.ts` | Server-only Supabase client. |
| `src/app/page.tsx` | Home: hero, stats, directory with search/filter/pagination. |
| `src/app/benches/[id]/page.tsx` | Bench detail. |
| `src/app/benches/[id]/adopt/page.tsx` + `src/components/adoption-form.tsx` | Adoption form. |
| `src/app/benches/[id]/confirmation/page.tsx` | Success page. |
| `src/__tests__/` | Vitest unit tests. `scripts/concurrency-test.mjs` — live concurrency test. |

## Database schema

```
benches                          adoptions
──────────────────────           ─────────────────────────────────────
id            uuid PK            id                       uuid PK
bench_number  text UNIQUE  ◀──   bench_id                 uuid FK → benches.id
area          text               donor_name               text      (private)
description   text               donor_email              text      (private, never exposed)
created_at    timestamptz        public_recognition_name  text      (nullable)
                                 display_name_publicly    boolean   (default false)
                                 duration_months          int       (6 | 12 | 24 | 36 | 60)
                                 start_date               date      (inclusive)
                                 end_date                 date      (EXCLUSIVE)
                                 source                   'seed' | 'web'
                                 created_at               timestamptz
                                 EXCLUDE (bench_id =, daterange(start,end) &&)
```

- One bench has many adoption records over time; history is never deleted.
- There is deliberately **no `is_adopted` column**. Availability is derived: a bench is adopted iff it has an adoption with `start_date <= today AND end_date > today`.
- `benches_public` (view) = every bench LEFT JOINed to its active adoption, with `public_display_name` already resolved (recognition name if consented, else `NULL` → "Anonymous Donor") and **no email column**.

## Key business rules

**Availability is computed from dates.** `today` is the calendar date in `America/New_York` (the park's time zone), computed identically in SQL (`park_today()`) and in TypeScript (`parkToday()`). `end_date` is exclusive; the UI shows the last covered day as `end_date - 1`.

**Only one active adoption per bench — enforced in the database.** `adopt_bench()` runs as a single transaction:

1. Validates name, email, recognition name, and duration (raising `INVALID_*` codes).
2. `SELECT … FOR UPDATE` on the bench row. If two requests arrive together, the second one **blocks here** until the first commits.
3. Checks for an active adoption. The second request now sees the first one's committed row and raises `BENCH_UNAVAILABLE`.
4. Computes `end_date = start_date + N months` with calendar-month arithmetic (`Jan 31 + 1 month = Feb 28`).
5. Inserts.

As defense in depth, an **exclusion constraint** on `(bench_id, daterange(start_date, end_date))` makes overlapping adoptions impossible even for someone inserting directly with SQL.

The Server Action maps `BENCH_UNAVAILABLE` to the message *"This bench has just been adopted by another visitor. Please choose another available bench."* and keeps the user's form input.

**Validation happens twice.** Zod on the server (before the database call) and again inside the SQL function / table constraints. The browser's HTML validation is a convenience only.

**Privacy.** `donor_email` exists only in the `adoptions` table; no view, query, page, or action returns it. `donor_name` is shown publicly only when `display_name_publicly = true` and no separate recognition name was given. The confirmation page shows the submitter their own choices and is only reachable via the adoption's UUID returned to them.

## Setup (local development)

Prerequisites: Node 20+ and a free [Supabase](https://supabase.com) account.

```bash
git clone <this repo>
cd bench-adoption
npm install
```

1. **Create a Supabase project** (Dashboard → New project; any region; save the database password somewhere, you won't need it for this app).
2. **Run the schema.** Dashboard → *SQL Editor* → New query → paste the full contents of `supabase/schema.sql` → Run.
3. **Seed the demo data.** Same SQL Editor → paste `supabase/seed.sql` → Run. The last statement prints a summary (expected: 520 benches, 120 adopted, 400 available, 180 records). Re-running either file is safe.
4. **Environment variables.** Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL` — Dashboard → *Project Settings* → *Data API* → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Dashboard → *Project Settings* → *API Keys* → `service_role` (secret)
5. **Run it.**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

### Tests

```bash
npm run typecheck        # tsc
npm run lint             # eslint
npm test                 # vitest: dates, validation, search normalization
npm run test:concurrency # fires 8 simultaneous adoptions at one bench against your Supabase project; expects exactly 1 success
npm run build            # production build
```

## Environment variables

| Name | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | server only | Your Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Service-role key used by server code to read/write. **Never** expose with a `NEXT_PUBLIC_` prefix and never commit it. |

No public/anon key is used anywhere.

## Assumptions

- **The 520 benches are fictional.** The park does have 500+ benches, but no inventory was provided, so `seed.sql` generates `VC-001`–`VC-520` with illustrative area labels. Nothing corresponds to a real bench or location.
- **All donors are fictional** (`@example.com` addresses). Seeded records are marked `source = 'seed'` and the detail page labels them as demonstration data.
- **Durations** of 6 / 12 / 24 / 36 / 60 months are sample program options, not official rules.
- **An adoption begins on the day it is submitted** (New York date). Start dates are not user-selectable.
- **No payment** is required or simulated; the confirmation page says so explicitly.
- **Public recognition requires consent.** Unchecked → "Anonymous Donor". Checked with no recognition name → the donor's full name is shown (the form says this).
- **Expired adoptions automatically free the bench**; historical records are kept.
- The site is an **independent demonstration**, not an official park service.

## Security notes & limitations

- Server-side env vars only; RLS on; public roles revoked; single validated write path; emails never leave the server.
- Anti-spam is deliberately lightweight: a **honeypot field** and a **best-effort in-memory rate limit** (5 submissions / 10 min per IP per server instance). On serverless hosting the limit is per-instance, so it slows abuse rather than stopping it.
- Anyone can submit the form, since the real program would collect payment or verify donors out-of-band. For production I would add: a CAPTCHA or Turnstile challenge, a durable rate limit (e.g. Upstash/Redis or a Postgres table), email verification before an adoption becomes active, and an authenticated admin role.
- This app has **not** had a formal security review.

## Trade-offs (to stay within ~3–5 hours)

- **No admin portal.** Editing/cancelling adoptions is done in the Supabase dashboard.
- **No email delivery.** The email is stored as contact info only.
- **No map.** Benches carry an area label, not coordinates, because no real inventory exists and paid map APIs were out of scope.
- **Search on submit** rather than as-you-type, to keep the directory a plain server-rendered page.
- **Hand-written UI primitives** instead of the full shadcn/ui install — four small components were all that was needed.
- **Dates only** (no times) for adoption periods.

## Future improvements

- Administrative authentication and a small admin view to edit or end adoptions.
- Import of the park's official bench inventory (and real area/GPS data).
- Park map integration showing bench locations.
- Donor accounts to view and renew adoptions; renewal flow that extends `end_date` without gaps.
- Email confirmations and expiry reminders.
- Payment processing, if the real program requires it.
- Durable rate limiting / CAPTCHA.

## Live application

_(added after deployment)_

---

*Built with Next.js, Supabase, and Tailwind for the Columbia Software Solutions take-home.*
