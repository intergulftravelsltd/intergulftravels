-- ============================================================================
-- 0012 — Care-of per program, Group Fund accounts, Umrah gender
--
--   1. affiliates.program   — 'hajj' | 'umrah' | 'both'. Care-of lists live
--                             inside the Hajj and Umrah sections; existing
--                             rows default to 'both' so nothing disappears.
--   2. affiliates.fund_mode — 'individual' (default: every pilgrim pays into
--                             their own ledger) or 'group_fund' (the group
--                             leader sends bulk money; package charges for
--                             pilgrims under them are debited from the
--                             leader's own account head instead).
--   3. affiliates.account_head_id — the leader's Group Fund ledger head,
--                             created automatically when fund_mode is switched
--                             to 'group_fund'.
--   4. umrah_passengers.gender — Male / Female filter on the Umrah list.
--
-- Idempotent: safe to re-run.
-- ============================================================================

alter table public.affiliates
  add column if not exists program text not null default 'both';
alter table public.affiliates
  add column if not exists fund_mode text not null default 'individual';
alter table public.affiliates
  add column if not exists account_head_id uuid references public.account_heads(id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'affiliates_program_check') then
    alter table public.affiliates
      add constraint affiliates_program_check check (program in ('hajj', 'umrah', 'both'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'affiliates_fund_mode_check') then
    alter table public.affiliates
      add constraint affiliates_fund_mode_check check (fund_mode in ('individual', 'group_fund'));
  end if;
end $$;

create index if not exists idx_affiliates_program   on public.affiliates (program);
create index if not exists idx_affiliates_fund_mode on public.affiliates (fund_mode) where fund_mode = 'group_fund';

alter table public.umrah_passengers
  add column if not exists gender text;

comment on column public.affiliates.program         is 'Which section this care-of belongs to: hajj, umrah or both.';
comment on column public.affiliates.fund_mode       is 'individual = pilgrims pay their own ledger; group_fund = leader pays in bulk into their own account head.';
comment on column public.affiliates.account_head_id is 'Group Fund ledger head (customer-type asset head) — set when fund_mode = group_fund.';
comment on column public.umrah_passengers.gender    is 'male | female (optional).';
