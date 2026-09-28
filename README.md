# 🛳️ Cruise Party Guest Portal

A private, mobile-first web app for a group cruise/party: guests log in with just
their email, complete their profile (clothing sizes, dietary needs, anything an
admin decides to ask), see the schedule/activities/announcements, and install
the site as an app on their phone. Admins manage everything — guests, dynamic
forms, response tracking, activities, schedule, content, and event settings —
from a separate `/admin` portal.

Built with Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres),
deployable to Vercel.

---

## 1. What you get

- Passwordless guest login (email only, admin preloads the guest list)
- Personal guest dashboard with a countdown, progress bar, and action cards
- A **dynamic information-request builder** — create any question type
  (text, number, dropdown, radio, checkboxes, yes/no, date, multiple choice)
  from the admin without touching code. T-shirt/shoe/trouser size are just
  the three requests seeded by default, not hardcoded special cases.
- **Kids & teens without their own login** — from `/actions`, a guest can add
  their children as "dependents" and answer information requests (sizes,
  dietary needs, anything) on each child's behalf. No email/account needed
  for the child; admin response tracking counts them alongside guests
  automatically.
- Per-request response tracking (submitted/outstanding, CSV export)
- Activities, party schedule, cruise itinerary, announcements, useful
  links/documents, packing checklist (all admin-editable)
- Cruise app install guide + "Install this site as an app" guide (PWA)
- Full admin portal: guests (CRUD, CSV import/export, search/filter),
  requests, responses, activities, schedule, content, event settings
- Supabase schema with RLS enabled, `event_id` on every guest-facing table
  so a second event can be added later without a schema rewrite

## 2. Architecture at a glance

```
src/
  app/                  Next.js App Router pages
    (guest pages)/dashboard, /my-cruise, /actions, /activities, /schedule,
                  /guide, /packing, /announcements
    admin/(dashboard)/   Admin portal (guests, requests, responses, …)
    admin/login/         Admin sign-in (separate auth, separate cookie)
    api/                 Route handlers (guest + admin mutations, CSV, auth)
  components/            UI components (guest-facing + admin/*)
  lib/
    supabase/admin.ts     Service-role client — SERVER ONLY, never imported client-side
    supabase/public.ts    Anon-key client (reserved for a future magic-link migration)
    auth/                 Guest + admin session (signed JWT cookies), kept separate
    guest-data.ts          Guest-scoped reads (always filtered by event/guest id)
    admin-data.ts          Admin dashboard/reporting reads
    validation.ts          All zod schemas (server-side validation for every mutation)
    csv.ts                  CSV import validation + export
  types/db.ts             Hand-written types mirroring the SQL schema
supabase/migrations/       SQL migrations (schema + RLS)
scripts/seed.ts             Demo data (~10 guests, requests, activities, …)
scripts/create-admin.ts     Creates/updates an admin login
```

**Adding a new guest-facing module later** (e.g. "Cabin Crawl Sign-up") means:
add a table (or reuse `information_requests` if it's just a question), a
route handler, a page/component — the auth, session, and data-isolation
layers underneath don't change. That's the "clean architecture for future
modules" the schema and lib layer were built around.

## 3. Guest authentication — how it actually works (read this)

The brief asks for **passwordless, no-signup email login** _and_ Postgres
**Row Level Security** for guest data isolation. Those two don't compose
directly: RLS keys off `auth.uid()`, which only exists once someone has a
real Supabase Auth session — and a guest here never gets one.

So the isolation boundary in this codebase is the **API layer**, not RLS:

1. Guest enters their email → `POST /api/auth/login` normalizes it, checks it
   against the `guests` table (via the service-role key, server-side only),
   and if it matches an active guest, issues a signed, HttpOnly JWT cookie
   (`cp_guest_session`, secret: `GUEST_SESSION_SECRET`) containing `guestId`
   + `eventId`.
2. Every guest page/API route reads that cookie, verifies it, and scopes
   every single database query by that `guestId`/`eventId` — see
   `src/lib/api-helpers.ts` (`requireGuestSession`) and `src/lib/guest-data.ts`.
   The browser **never** talks to Supabase directly and never sees the
   service-role key.
3. RLS is still turned on for every table (`supabase/migrations/0002_rls.sql`),
   with **no policies for the `anon`/`authenticated` roles** — so even if a
   guest somehow obtained the anon key, PostgREST would return nothing. It's
   defense-in-depth today; it becomes the primary mechanism once guests get
   real sessions (see below).

**Migrating to Supabase Magic Link / OTP later** — the brief specifically
asks for this to be easy:
- Swap `POST /api/auth/login` to call `supabase.auth.signInWithOtp({ email })`
  instead of setting a custom cookie.
- Add RLS policies keyed on `auth.jwt() ->> 'email'` (a starter is commented
  in `0002_rls.sql`).
- Guest-scoped reads can then move from the service-role client to the anon
  client (`src/lib/supabase/public.ts`, already present) called from Server
  Components with the user's real session.
- The guest `id`/`email` shape (`GuestSessionPayload`) is unchanged, so pages
  and components don't need to be rewritten — only the login route and the
  RLS policies do.

**Accepted risk (as explicitly requested):** because there's no OTP/password,
anyone who knows another guest's email can log in as them. Mitigations in
place: rate limiting (`login_attempts` table, 8 attempts / 15 min per email),
no endpoint ever returns the guest list, and the login failure message is
generic. This is a v1 trade-off, not an oversight.

## 4. Admin authentication

Deliberately separate from guest auth: a real password (bcrypt, 12 rounds),
its own signed JWT cookie (`cp_admin_session`, secret: `ADMIN_SESSION_SECRET`,
12-hour expiry vs. the guest session's 180 days), and rate limiting on the
same `login_attempts` table. It does **not** use Supabase Auth, so there's no
SMTP/email-provider setup required to get an admin account working — see
"Create your admin login" below.

`middleware.ts` protects `/admin/**` (except `/admin/login`) by verifying the
admin cookie before the page even renders; every `/api/admin/**` route
independently re-checks via `requireAdminSession()`, so the API is protected
even if middleware were ever bypassed.

## 5. Database schema

See `supabase/migrations/0001_init.sql` for the full schema and
`0002_rls.sql` for RLS. Highlights:

- Every guest-facing table carries `event_id` from day one (`events` is the
  root table), so a second event (e.g. "Cruise Party 2027") is a new row in
  `events` plus new `guests`/`activities`/etc. rows — no migration needed.
- Multi-select answers (checkboxes/multiple-choice) are stored in a real
  junction table (`guest_response_options`), not a JSON array, so they stay
  queryable and joinable like everything else.
- `login_attempts` backs rate limiting with a real table instead of an
  in-memory counter, because Vercel serverless functions don't share memory
  between invocations (an in-memory limiter resets on every cold start).

## 6. Getting demo data + an admin login onto your deployed site

You have two options here. **If you're not comfortable with a terminal, use
Option A** — it needs nothing but a web browser.

### Option A — No terminal, just the Supabase SQL Editor

Requires all three migrations (`0001_init.sql`, `0002_rls.sql`,
`0003_dependents.sql`) to already be run.

1. Open `supabase/seed/seed.sql` in this repo (view it on GitHub, or open it
   in any text/code editor — you're just reading and editing plain text).
2. Near the top, edit these three lines to your own details:
   ```sql
   v_admin_email    text := 'you@example.com';
   v_admin_password text := 'ChangeThisPassword123';
   v_admin_name     text := 'Your Name';
   ```
   Use a plain password (letters/numbers, no unusual symbols) and keep the
   quotes around each value exactly as they are.
3. Copy the **entire file**, paste it into your Supabase project's SQL
   Editor, and click **Run**.
4. Refresh your Vercel site. You should now see the real event name and be
   able to log in as `sarah.thompson@example.com` (or any of the 10 seeded
   guests — see the file for the full list). Log into `/admin/login` with
   the email/password you set in step 2.

Re-running the script later is safe: it resets the demo guest/event data
to a clean state and updates your admin password to whatever's in the file
at the time — it won't create duplicate admins or guests.

### Option B — Terminal + Node.js scripts

Only worth it if you're already comfortable with git/npm, want programmatic
CSV-style seeding, or plan to customize the seed data significantly (it's
easier to edit `scripts/seed.ts` in TypeScript than the SQL version). See
"Local setup" below, then run `npm run seed` and `npm run create-admin`.

## 7. Local setup (for running the app itself, not just seeding it)

### Prerequisites
- Node.js 18.18+
- A free [Supabase](https://supabase.com) project
- npm

### Steps

1. **Clone and install**
   ```bash
   git clone <this-repo>
   cd 20yersanniversary
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) →
   note your Project URL, `anon` public key, and `service_role` key
   (Project Settings → API).

3. **Run the migrations, in order**, via the Supabase SQL Editor: paste and
   run each of `supabase/migrations/0001_init.sql`, then `0002_rls.sql`,
   then `0003_dependents.sql`. (Or use the Supabase CLI: `supabase link`
   then `supabase db push`.) If you already ran 0001/0002 before
   `0003_dependents.sql` existed, just run that one file now — it only adds
   new tables, it's safe to run on top of an already-seeded database.

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Project Settings → API.
   - `GUEST_SESSION_SECRET`, `ADMIN_SESSION_SECRET` — generate two different
     random strings: `openssl rand -base64 48`.
   - `NEXT_PUBLIC_EVENT_SLUG` — leave as `cruise-party-2026` to match the
     seed data, or pick your own (must match what you seed).

5. **Seed demo data** (~10 guests, sample requests/responses, activities,
   schedule, announcements, packing list, app guide):
   ```bash
   npm run seed
   ```

6. **Create your admin login**
   ```bash
   npm run create-admin -- --email you@example.com --password "a-strong-password" --name "Your Name"
   ```

7. **Run it**
   ```bash
   npm run dev
   ```
   - Guest app: [http://localhost:3000](http://localhost:3000) — log in with
     any seeded guest email, e.g. `sarah.thompson@example.com`.
   - Admin portal: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
     with the email/password you just created.

### Other useful scripts
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run build       # production build
```

## 8. Deploying to Vercel

1. Push this repo to GitHub (see below).
2. In Vercel: **New Project** → import the repo.
3. Add the same environment variables from `.env.local` under
   **Project Settings → Environment Variables** (all of them — Vercel does
   not read `.env.local`). Do this for Production, Preview, and Development.
4. Deploy. Vercel auto-detects Next.js — no build command changes needed.
5. Seed demo data and create your admin login using **Option A or B from
   section 6 above** — both work directly against your Supabase project,
   independent of how the Next.js app itself is deployed.
6. Once deployed, share the URL with your guests. On iPhone/Android they can
   tap "Add to Home Screen" — see `/guide` in the app for the walkthrough.

## 9. Known simplifications (so you don't mistake them for bugs)

- **Images are URLs, not uploads.** Profile photos, activity photos, logo,
  hero image are all plain URL fields (paste a link — Unsplash, Imgur, your
  own hosting, whatever). Wiring up Supabase Storage uploads is a natural
  next step but wasn't required for a working v1 and adds bucket/policy
  setup the brief didn't ask for.
- **`npm audit` will show Next.js advisories.** Several relate to Server
  Actions (this app uses plain Route Handlers, not `"use server"` actions)
  and the built-in Image Optimizer (the one place this app renders external
  images uses `unoptimized`, bypassing that code path entirely). Real
  exposure is low, but before a real launch, run `npm audit` and update
  Next.js to whatever's current.
- **Guest core fields (cabin, booking ref, group) are admin-managed only.**
  Guests can't edit their own name/cabin/phone from the UI — that's
  deliberate (it's roster data an organiser controls), but you can wire up
  a self-service edit form the same way `/actions` works if you want it.
- **Single event is live at a time**, selected by `NEXT_PUBLIC_EVENT_SLUG`.
  The schema supports many events; there's no admin UI yet to switch
  between them (would be a natural v2: a subdomain or path per event).

## 10. Security checklist (what's implemented)

- Emails normalized (trim + lowercase) before every comparison
- Rate limiting on both login endpoints (DB-backed, survives cold starts)
- No endpoint ever returns the full guest list to an unauthenticated caller
- Every guest API route re-derives `guestId` from the verified session
  cookie — a request body can send whatever it wants, it's ignored for
  identity purposes
- Every admin API route independently calls `requireAdminSession()` (not
  just relying on middleware)
- Service-role key is imported only in files marked `import 'server-only'`
  under `src/lib/supabase/admin.ts` — importing it from a Client Component
  fails the build
- All mutation input validated server-side with zod (`src/lib/validation.ts`)
  — client-side validation is a UX nicety, not the security boundary
- RLS enabled on every table; CSV import validates email format and checks
  duplicates (within file and against the DB) before writing anything

## 11. Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres +
service-role API access) · `jose` (JWT sessions) · `bcryptjs` (admin
passwords) · `zod` (validation) · `papaparse` (CSV) · `lucide-react` (icons)
· hand-rolled service worker + web manifest for PWA installability.
