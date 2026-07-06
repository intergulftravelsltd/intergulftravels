-- =============================================================================
-- 0006_careof_docstatus.sql
-- Care-of / affiliate registry + per-pilgrim document status.
--
--  * public.affiliates — the marketers / introducers ("care of") who bring
--    pilgrims. Each carries an editable human code (CO-0001), name, phone,
--    address, branch. Writes go through the service-role API (like every other
--    management table); staff may read.
--  * hajj_pilgrims / umrah_passengers gain:
--      - affiliate_id  → who this pilgrim is "care of"
--      - doc_status    → text[] of completed document checkpoints
--                        (biometric, passport_original, visa_ok,
--                         medical_done, vaccine_card) for status filtering.
--
-- Idempotent: safe to re-run.
-- =============================================================================

-- ---- Affiliates ("care of") -------------------------------------------------
create table if not exists public.affiliates (
  id         uuid primary key default gen_random_uuid(),
  code       text,
  name       text not null,
  phone      text,
  address    text,
  note       text,
  type       text not null default 'agent',
  branch     text not null default 'general',
  active     boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_affiliates_branch on public.affiliates(branch);
create index if not exists idx_affiliates_active on public.affiliates(active);

alter table public.affiliates enable row level security;
drop policy if exists "staff read affiliates" on public.affiliates;
create policy "staff read affiliates" on public.affiliates
  for select using (public.is_staff());

-- ---- Care-of link + document status on both pilgrim tables ------------------
alter table public.hajj_pilgrims
  add column if not exists affiliate_id uuid references public.affiliates(id) on delete set null,
  add column if not exists doc_status   text[] not null default '{}';

alter table public.umrah_passengers
  add column if not exists affiliate_id uuid references public.affiliates(id) on delete set null,
  add column if not exists doc_status   text[] not null default '{}';

create index if not exists idx_hajj_affiliate  on public.hajj_pilgrims(affiliate_id);
create index if not exists idx_umrah_affiliate on public.umrah_passengers(affiliate_id);
