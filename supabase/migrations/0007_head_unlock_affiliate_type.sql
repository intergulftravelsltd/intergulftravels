-- =============================================================================
-- 0007_head_unlock_affiliate_type.sql
--   1. system_key on account_heads — a stable internal id for the built-in
--      "system" heads so the accounting engine can stop resolving them by their
--      (now fully editable / renamable) display name. Backfilled by name, which
--      was read-only for system heads and is therefore reliable.
--   2. affiliates.type — 'agent' (a marketer bringing many pilgrims) vs
--      'family' (one family group under a single head).
-- Idempotent: safe to re-run.
-- =============================================================================

-- ---- 1) Stable key for the built-in heads -----------------------------------
alter table public.account_heads
  add column if not exists system_key text;

update public.account_heads set system_key = case name
  when 'Cash in Hand'            then 'cash_in_hand'
  when 'Hajj Package Income'     then 'hajj_package_income'
  when 'Umrah Package Income'    then 'umrah_package_income'
  when 'Air Ticket Income'       then 'air_ticket_income'
  when 'Visa Service Income'     then 'visa_service_income'
  when 'Office Rent'             then 'office_rent'
  when 'Salary & Wages'          then 'salary_wages'
  when 'Utility Bills'           then 'utility_bills'
  when 'Office Expense'          then 'office_expense'
  when 'Travelling & Conveyance' then 'travelling_conveyance'
  when 'Loan Receivable'         then 'loan_receivable'
  when 'Loan Payable'            then 'loan_payable'
  when 'Capital'                 then 'capital'
  else system_key
end
where is_system = true and system_key is null;

-- One row per (system_key, branch); plain (non-unique) index avoids blocking the
-- migration on any unexpected duplicate while still speeding the lookup.
create index if not exists idx_account_heads_system_key
  on public.account_heads(system_key, branch);

-- ---- 2) Care-of / affiliate type --------------------------------------------
alter table public.affiliates
  add column if not exists type text not null default 'agent';
