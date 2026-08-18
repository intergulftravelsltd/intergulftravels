-- ============================================================================
--  0009_dashboard_perf.sql
--  Dashboard in one round-trip + missing hot-path indexes.
--
--  Before this, /admin ran ~8 separate queries per load (heads, period
--  transactions, recent transactions + a name lookup, two counts, two enquiry
--  counts) — each one a full network round-trip, and the period sum silently
--  capped at PostgREST's 1000-row page. dashboard_summary() computes all of it
--  inside Postgres and returns a single jsonb payload.
-- ============================================================================

-- ---- hot-path indexes -------------------------------------------------------
-- Branch-scoped, date-ranged scans (dashboard period sums, cash book, reports).
create index if not exists idx_tx_branch_date on public.transactions (branch, date desc);
-- "Recent transactions" ordering (previously sorted without an index).
create index if not exists idx_tx_created on public.transactions (created_at desc);
-- Branch-scoped head lists (every accounts page filters active heads by branch).
create index if not exists idx_heads_branch_active on public.account_heads (branch, active);
-- Dashboard / hajj list: this-year count per branch + recent ordering.
create index if not exists idx_hajj_branch_year on public.hajj_pilgrims (branch, year);
create index if not exists idx_hajj_created on public.hajj_pilgrims (created_at desc);
create index if not exists idx_umrah_branch on public.umrah_passengers (branch);
-- Payment → voucher joins in statements.
create index if not exists idx_pay_tx on public.payments (transaction_id);
-- Receipts list: branch + date-ordered payment history.
create index if not exists idx_pay_branch_date on public.payments (branch, date desc);
-- Head lists filtered by branch + subtype (cash-bank, due, cash book).
create index if not exists idx_heads_branch_subtype on public.account_heads (branch, subtype);
-- Pilgrim/passenger list pages filter by branch + status.
create index if not exists idx_hajj_branch_status on public.hajj_pilgrims (branch, status);
create index if not exists idx_umrah_branch_status on public.umrah_passengers (branch, status);
-- Loans page (branch, newest first).
create index if not exists idx_loans_branch_date on public.loans (branch, date desc);
-- Activity page filters by action.
create index if not exists idx_activity_action on public.activity_log (action);

-- ---- the whole admin dashboard in one call ---------------------------------
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
           'debit_name',  coalesce(dh.name, 'Unknown'),
           'credit_name', coalesce(ch.name, 'Unknown')
         ) order by r.created_at desc), '[]'::jsonb) as rows
  from (
    select t.id, t.voucher_no, t.date, t.amount, t.created_at,
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

-- Server-only: the app calls this through the service-role key; browsers never
-- reach it directly.
revoke execute on function public.dashboard_summary(text, date, date, int) from public, anon, authenticated;
grant execute on function public.dashboard_summary(text, date, date, int) to service_role;
