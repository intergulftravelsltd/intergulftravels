-- ============================================================================
-- 0011 — Manual voucher / receipt number
--
-- Staff post entries from hand-written Money Receipts, Expense Vouchers and
-- Jama Vouchers that already carry a printed serial. The system keeps its own
-- auto number (V-00857, RV-00012 …) for internal tracking, and this column
-- stores the physical paper's number so ledgers, the voucher register and
-- statements can print both — which is what reconciliation and audit need.
--
-- Idempotent: safe to re-run.
-- ============================================================================

alter table public.transactions add column if not exists manual_ref text;
alter table public.payments     add column if not exists manual_ref text;

create index if not exists idx_tx_manual_ref  on public.transactions (manual_ref) where manual_ref is not null;
create index if not exists idx_pay_manual_ref on public.payments     (manual_ref) where manual_ref is not null;

comment on column public.transactions.manual_ref is 'Hand-written voucher / receipt number from the physical paper (audit reference).';
comment on column public.payments.manual_ref     is 'Hand-written money-receipt number from the physical paper (audit reference).';
