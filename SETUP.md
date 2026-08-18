# Inter Gulf Travels Ltd — Setup Guide

A modern Hajj & Umrah agency website with a full content-management dashboard.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Lenis smooth-scroll · Supabase (Postgres + Auth + Storage) · Sharp (WebP image pipeline).

---

## 1. Prerequisites

- **Node.js 18.18+** (Node 20 LTS recommended) and **npm**
- A free **Supabase** account → <https://supabase.com>
- (For deployment) a **Vercel** account → <https://vercel.com>

---

## 2. Install & run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The marketing site works immediately with bundled
seed content — **even before you connect Supabase**. Auth, the dashboard and the
admin panel need Supabase keys (step 4).

---

## 3. Environment file

All secrets live in **`.env.local`** (already created for you, and git-ignored —
it is never pushed to GitHub). Open it and paste the values below.

| Variable | Required | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | `http://localhost:3000` in dev; your real domain in production |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Project Settings → **API** → *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase → Project Settings → **API** → *anon / public* key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase → Project Settings → **API** → *service_role* key (**keep secret**) |
| `ADMIN_EMAILS` | yes | Comma-separated emails that become admins |

---

## 4. Supabase — step by step

1. **Create a project** at <https://supabase.com/dashboard> → *New project*. Pick a
   region close to Bangladesh (e.g. Singapore). Save the database password.
2. **Get your keys:** Project Settings → **API**. Copy *Project URL*, *anon* key and
   *service_role* key into `.env.local`.
3. **Create the database.** Open the **SQL Editor** and run the files in
   `supabase/` in this order (copy/paste each, click *Run*):
   1. `supabase/migrations/0001_schema.sql` — tables, triggers, profile auto-create
   2. `supabase/migrations/0002_policies.sql` — row-level security + storage buckets (`media`, `vault`)
   3. `supabase/migrations/0003_management.sql` — the accounting + Hajj/Umrah ERP (chart of accounts, double-entry ledger, pilgrims, packages, payments, loans, activity log). Auto-seeds the system account heads (Cash, incomes, expenses, loans, capital).
   4. `supabase/migrations/0004_site_content.sql` — Videos + flight/hotel Affiliations (seeds the partner list).
   5. `supabase/migrations/0005…0008` — feature migrations (secure vault & branches, doc checklists, head unlock, family groups). Run in numeric order.
   6. `supabase/migrations/0009_dashboard_perf.sql` — **performance**: the whole admin dashboard as one SQL call + missing indexes. The dashboard still works without it (slower per-table fallback), but apply it for the fast path.
   7. `supabase/seed.sql` — blog posts, site settings, menus, gallery (optional but recommended)

   *(Prefer the CLI? `supabase db push` works too — see `supabase/README.md`.)*
4. **Storage buckets** `media` (public) and `vault` (private) are created by the
   migration. No manual step needed.
5. Restart `npm run dev` so the new env vars load.

---

## 5. Create the default login

The admin account is any user whose email is in `ADMIN_EMAILS` (default
`admin@intergulftravelsltd.com`). Two ways to create it:

**Option A — Supabase dashboard (recommended for the default account):**
Authentication → **Users** → *Add user* → enter `admin@intergulftravelsltd.com`
and a password → *Auto-confirm*. The database trigger automatically gives this
email the `admin` role.

> Suggested default account to set now and change later:
> **Email:** `hellointergulftravelsltd@gmail.com` · **Password:** *(choose a strong one)*

### Logging in

Staff and admins sign in directly at **`/admin`**. When signed out, `/admin`
shows the login form; after signing in, staff land on the admin dashboard.
There is no separate customer area.

---

## 6. Images are always WebP

The site never serves JPG/PNG.

- **Local assets:** drop any image into `/public` and run `npm run images:webp`
  — every raster file is converted to optimized WebP in place.
- **Dashboard uploads:** any image uploaded in `/admin` (blog cover, gallery,
  media) or a member's vault is **automatically converted to optimized WebP** on
  the server before it is stored. JPG/PNG in → WebP out, every time.

---

## 7. Managing content

Sign in at **`/admin`**:

- **Blog Posts** — create/edit/publish articles (auto-WebP cover images)
- **Media Library / Gallery** — upload and manage images
- **Contact / Estimate Requests** — view and action customer enquiries
- **Navigation / Footer / Site Settings** — edit menus, links, phone, email, WhatsApp
- **Users** — promote/demote admins
- **Document Vault** — view documents members uploaded securely

---

## 8. Deploy to Vercel

1. Push this repo to GitHub (see below).
2. In Vercel → *New Project* → import the repo.
3. Add the same variables from `.env.local` under **Settings → Environment Variables**
   (use your production `NEXT_PUBLIC_SITE_URL`).
4. Build command `next build`, output is automatic. Deploy.
5. In Supabase → Authentication → **URL Configuration**, add your production URL to
   *Site URL* and *Redirect URLs* (`https://your-domain/auth/callback`).

---

## 9. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Growthency/intergulftravelsltd.git
git push -u origin main
```

`.env.local` is git-ignored, so your keys never leave your machine.

---

## 10. Project structure

```
app/
  (site)/        marketing pages (home, hajj, umrah, services, about, blog, …)
  admin/         admin dashboard
  dashboard/     member dashboard + document vault
  login, signup, portal, auth/   authentication
  api/           contact, estimate, vault, admin upload/CRUD
components/       brand, layout, ui, effects, home, blog, forms, admin, dashboard
lib/              site content, blog, supabase clients, image (WebP), utils
supabase/         SQL migrations + seed
scripts/          convert-to-webp.mjs
```
