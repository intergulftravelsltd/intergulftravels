-- ============================================================================
--  0010_dashboard_charts.sql
--  Dashboard visuals: 12-month cash-flow trend in one call, and the recent-
--  transaction feed now carries the voucher type (for direction icons).
--  Safe to run standalone — it re-creates dashboard_summary (superset of 0009).
-- ============================================================================

-- ---- monthly income/expense towers ------------------------------------------
create or replace function public.dashboard_trend(
  p_branch text default null,
  p_months int  default 12
) returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with months as (
  select (date_trunc('month', now()) - (interval '1 month' * g))::date as m0
  from generate_series(coalesce(p_months, 12) - 1, 0, -1) as g
),
tx as (
  select date_trunc('month', t.date)::date as m0,
         coalesce(sum(t.amount) filter (where ch.type = 'income'), 0)  as income,
         coalesce(sum(t.amount) filter (where dh.type = 'expense'), 0) as expense
  from transactions t
  left join account_heads ch on ch.id = t.credit_account_id
  left join account_heads dh on dh.id = t.debit_account_id
  where t.date >= (date_trunc('month', now()) - (interval '1 month' * (coalesce(p_months, 12) - 1)))::date
    and (p_branch is null or t.branch = p_branch)
  group by 1
)
select coalesce(jsonb_agg(jsonb_build_object(
         'ym', to_char(months.m0, 'YYYY-MM'),
         'income', coalesce(tx.income, 0),
         'expense', coalesce(tx.expense, 0)
       ) order by months.m0), '[]'::jsonb)
from months
left join tx on tx.m0 = months.m0;
$$;

revoke execute on function public.dashboard_trend(text, int) from public, anon, authenticated;
grant execute on function public.dashboard_trend(text, int) to service_role;

-- ---- dashboard_summary v2: recent_tx rows now include the voucher type ------
create or replace function public.dashboard_summary(
  p_branch text default null,
  p_from   date default null,
  p_to     date default null,
  p_year   int  default null
) returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with heads as (
  select h.subtype,
         (h.opening_balance * case when h.opening_is_debit then 1 else -1 end)
           + h.debit_total - h.credit_total as net_debit
  from account_heads h
  where h.active
    and (p_branch is null or h.branch = p_branch)
),
balances as (
  select
    coalesce(sum(net_debit)  filter (where subtype = 'cash'), 0)                       as cash,
    coalesce(sum(net_debit)  filter (where subtype = 'bank' and net_debit >= 0), 0)    as bank,
    coalesce(sum(-net_debit) filter (where subtype = 'bank' and net_debit < 0), 0)     as bank_overdraft,
    coalesce(sum(net_debit)  filter (where subtype = 'customer' and net_debit > 0), 0) as receivable
  from heads
),
period as (
  select
    coalesce(sum(t.amount) filter (where ch.type = 'income'), 0)  as period_income,
    coalesce(sum(t.amount) filter (where dh.type = 'expense'), 0) as period_expense
  from transactions t
  left join account_heads ch on ch.id = t.credit_account_id
  left join account_heads dh on dh.id = t.debit_account_id
  where (p_branch is null or t.branch = p_branch)
    and (p_from is null or t.date >= p_from)
    and (p_to   is null or t.date <= p_to)
),
recent_tx as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', r.id, 'voucher_no', r.voucher_no, 'date', r.date, 'amount', r.amount,
           'type', r.type,
           'debit_name',  coalesce(dh.name, 'Unknown'),
           'credit_name', coalesce(ch.name, 'Unknown')
         ) order by r.created_at desc), '[]'::jsonb) as rows
  from (
    select t.id, t.voucher_no, t.date, t.amount, t.type, t.created_at,
           t.debit_account_id, t.credit_account_id
    from transactions t
    where (p_branch is null or t.branch = p_branch)
    order by t.created_at desc
    limit 6
  ) r
  left join account_heads dh on dh.id = r.debit_account_id
  left join account_heads ch on ch.id = r.credit_account_id
),
recent_pilgrims as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id, 'tracking_no', p.tracking_no, 'name', p.name,
           'reg_type', p.reg_type, 'branch', p.branch,
           'created_at', p.created_at, 'year', p.year
         ) order by p.created_at desc), '[]'::jsonb) as rows
  from (
    select id, tracking_no, name, reg_type, branch, created_at, year
    from hajj_pilgrims
    where (p_branch is null or branch = p_branch)
    order by created_at desc
    limit 6
  ) p
),
counts as (
  select
    (select count(*) from hajj_pilgrims
      where (p_year is null or year = p_year)
        and (p_branch is null or branch = p_branch)) as hajj_this_year,
    (select count(*) from umrah_passengers
      where (p_branch is null or branch = p_branch)) as umrah_total,
    (select count(*) from contact_requests where handled = false) as new_contacts,
    (select count(*) from estimate_requests where status = 'new') as new_estimates
)
select jsonb_build_object(
  'cash', b.cash,
  'bank', b.bank,
  'bank_overdraft', b.bank_overdraft,
  'receivable', b.receivable,
  'period_income', p.period_income,
  'period_expense', p.period_expense,
  'hajj_this_year', c.hajj_this_year,
  'umrah_total', c.umrah_total,
  'new_contacts', c.new_contacts,
  'new_estimates', c.new_estimates,
  'recent_tx', rt.rows,
  'recent_pilgrims', rp.rows
)
from balances b, period p, recent_tx rt, recent_pilgrims rp, counts c;
$$;

revoke execute on function public.dashboard_summary(text, date, date, int) from public, anon, authenticated;
grant execute on function public.dashboard_summary(text, date, date, int) to service_role;
