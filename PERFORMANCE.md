# Performance audit & fixes — 18 Aug 2026

The admin console felt slow because almost every page paid for (a) repeated
auth round-trips, (b) serial waterfalls of independent Supabase queries, and
(c) whole-table reads aggregated in JS. The public site additionally shipped
both languages' dictionaries (~50 KB) in the client JS of every route.

## Apply this once (Supabase)

Run **`supabase/migrations/0009_dashboard_perf.sql`** in the SQL Editor (or
`supabase db push`). It adds:

- `dashboard_summary()` — the entire `/admin` dashboard (balances, period
  income/expense, counts, recent vouchers + pilgrims) computed in **one**
  round-trip, exact past PostgREST's silent 1000-row cap.
- Missing hot-path indexes: `transactions(branch, date)`, `transactions(created_at)`,
  `account_heads(branch, active)`, `(branch, subtype)`, `hajj_pilgrims(branch, year)`,
  `(branch, status)`, `(created_at)`, `umrah_passengers(branch)`, `(branch, status)`,
  `payments(branch, date)`, `(transaction_id)`, `loans(branch, date)`, `activity_log(action)`.

The app works without it (it falls back to parallel per-table queries), but the
fast path needs it.

## What changed in the app

**Auth (every admin request)** — the layout, `requireStaff()` and
`getStaffScope()` each did their own `auth.getUser()` + `profiles` lookup
(4–5 network calls per page). Now one request = one cached `getAuthUser()` +
one `getProfileLite()` (`lib/supabase/server.ts`), shared by all of them.
`requireStaff` is `cache()`-wrapped too, and `createAdminClient()` is a
singleton instead of ~10 fresh clients per render.

**Dashboard (`app/admin/page.tsx`)** — was 6 serial stages with unbounded
`select('*')` reads summed in JS; now a single `dashboard_summary` RPC call
(fallback: all 8 queries in one `Promise.all`, pruned columns).

**Cash book** — no longer reads the entire liquid-account history on every
view. It fetches only rows from the selected `from` date onward and derives the
opening balance from the live trigger-maintained head balances, so the opening
is exact even when history exceeds a page.

**Family-group ledger (`lib/management/group.ts`)** — member balances and the
combined statement now load concurrently; head-picker dropdown filters
(`group_head_id is null`) in SQL with pruned columns.

**Other admin pages** — independent loaders parallelized and/or filters pushed
into SQL on: accounts hub, expenses, account ledger (`heads/[id]`, also fixed
the ineffective `limit: 2000` → PostgREST caps at 1000), reports (head list
fetched once per request instead of once per view), hajj & umrah profile pages,
hajj doc-report (year/package/status now SQL-side), group payment.

**Public site** — `getVideos()` / `getAffiliations()` hit Supabase live per
request with a cookie-bound client; both are now cookieless + `unstable_cache`
(120 s, tags `videos` / `affiliations`, invalidated by their admin routes).

**Client bundle**
- The two-language dictionary bundle no longer ships as JS on every route: the
  (site) layout resolves the active language on the server and provides it via
  `DictionaryProvider` (`components/providers/LocaleProvider.tsx`).
- `ScrollProgress` / `ScrollToTop` rewritten without framer-motion (rAF + CSS).
- The mobile drawer (`MobileMenu` + its framer-motion) is `next/dynamic`, out of
  the desktop first load.
- Post editor loads `marked` + `dompurify` (~35 KB gz) only when Preview is
  opened.
- Removed the unused `date-fns` dependency.

## Known items deferred (worth doing next)

1. **Public site is fully SSR per request** — `getLocale()` reads `headers()`
   in the root layout, which opts all ~34 public pages out of static/ISR. Fixing
   needs locale to become part of the route (e.g. `app/[locale]/…`) — a larger
   refactor.
2. **Admin area dictionaries** (`lib/dictionaries/areas/*`) still bundle both
   languages per admin route (~24–48 KB raw each, half unused).
3. **List pages past 1000 rows** — hajj/umrah lists, vouchers, receipts,
   contacts/estimates still cap at PostgREST's 1000-row page with no
   pagination; totals computed over that page. Needs `.range()` pagination or
   SQL aggregates per page.
4. **Group payment API** posts members serially (~5–6 round-trips each) —
   correct (voucher numbering) but slow for big families; could hoist the cash
   head and batch the writes.
5. **Security hardening (report only, unchanged):**
   - `/api/contact` + `/api/estimate` are public service-role writes with no
     rate limiting/honeypot — bulk-insert abuse is possible.
   - `SHARE_LINK_SECRET` is not set in `.env.example`; the share-token HMAC key
     falls back to the service-role key (fine) and then to the **public anon
     key** (not fine) — set a dedicated `SHARE_LINK_SECRET` in production.
   - `requireAdmin` vs `requireStaff` guard inconsistently across content
     routes (e.g. staff can edit affiliations but not videos).
   - Balance-sheet "as of" date filter is decorative (transactions not
     filtered by it).
