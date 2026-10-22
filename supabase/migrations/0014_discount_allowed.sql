-- ============================================================================
-- 0014 — "Discount Allowed" expense head
--
-- Customer discounts used to be posted as  Dr Package Income / Cr Customer,
-- i.e. they silently reduced Hajj / Umrah package income. The office wants
-- discounts shown as an EXPENSE instead, so:
--
--   1. a built-in expense head "Discount Allowed" (system_key
--      'discount_allowed', code 5006) is seeded for the head office and for
--      every branch that has posted a discount;
--   2. every existing discount voucher (DV-xxxxx, or method = 'adjustment',
--      debiting a package-income head) is re-pointed to the branch's
--      Discount Allowed head — and the running debit totals of both heads
--      are corrected by hand, because the balance trigger only fires on
--      insert / delete.
--
-- New discounts posted by the app after this release already use the
-- Discount Allowed head (it is created on demand per branch).
-- Idempotent: safe to re-run (already-moved vouchers are skipped).
-- ============================================================================

-- 1. Seed the head office template + a copy per branch that has discounts.
insert into public.account_heads (code, name, type, subtype, is_system, system_key, branch)
select '5006', 'Discount Allowed', 'expense', 'expense', true, 'discount_allowed', b.branch
from (
  select distinct branch from public.transactions
  where (voucher_no like 'DV-%' or method = 'adjustment')
  union select 'general'
) b
where not exists (
  select 1 from public.account_heads h
  where h.system_key = 'discount_allowed' and h.branch = b.branch
);

-- 2. Move existing discount vouchers off the income heads.
do $$
declare
  r record;
  v_target uuid;
begin
  for r in
    select t.id, t.amount, t.branch, t.debit_account_id
    from public.transactions t
    join public.account_heads inc on inc.id = t.debit_account_id
    where (t.voucher_no like 'DV-%' or t.method = 'adjustment')
      and inc.type = 'income'
  loop
    select id into v_target
    from public.account_heads
    where system_key = 'discount_allowed' and branch = r.branch
    limit 1;
    if v_target is null then
      -- branch without a head yet (shouldn't happen after step 1) → create it
      insert into public.account_heads (code, name, type, subtype, is_system, system_key, branch)
      values ('5006', 'Discount Allowed', 'expense', 'expense', true, 'discount_allowed', r.branch)
      returning id into v_target;
    end if;

    update public.transactions set debit_account_id = v_target where id = r.id;
    -- the trigger ignores UPDATE: fix the two debit totals by hand
    update public.account_heads set debit_total = debit_total - r.amount where id = r.debit_account_id;
    update public.account_heads set debit_total = debit_total + r.amount where id = v_target;
  end loop;
end $$;

comment on column public.account_heads.system_key is
  'Stable id of a built-in head: cash_in_hand, hajj_package_income, umrah_package_income, discount_allowed, loan_receivable, loan_payable …';
