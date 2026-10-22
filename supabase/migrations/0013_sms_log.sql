-- ============================================================================
-- 0013 — SMS log
--
-- Every SMS the console sends through the gateway (khudebarta.com masking
-- SMS) is recorded here: who it went to, the final text, whether the gateway
-- accepted it and the gateway's message id / error. The SMS History page
-- reads it; the send route writes it (best effort — a missing table never
-- blocks sending, the history page just shows a "run migration" hint).
--
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists public.sms_log (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  branch               text,
  sent_by              text,
  -- one id per "Send" click so a bulk send can be grouped
  campaign_id          text,
  recipient_kind       text not null,            -- umrah | hajj | careof | custom
  recipient_id         uuid,
  recipient_name       text,
  phone                text not null,            -- 8801XXXXXXXXX as sent to the gateway
  message              text not null,            -- final text after {name} / {due} merge
  parts                int  not null default 1,  -- billed SMS segments
  status               text not null check (status in ('sent', 'failed')),
  provider             text not null default 'khudebarta',
  provider_message_id  text,
  provider_status      text,                     -- gateway status code
  error                text
);

create index if not exists idx_sms_log_date     on public.sms_log (created_at desc);
create index if not exists idx_sms_log_branch   on public.sms_log (branch, created_at desc);
create index if not exists idx_sms_log_campaign on public.sms_log (campaign_id);

alter table public.sms_log enable row level security;

-- Staff may read the log through the anon/auth client; writes go through the
-- service-role client from the server only.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sms_log' and policyname = 'staff read sms_log') then
    if exists (select 1 from pg_proc where proname = 'is_staff' and pronamespace = 'public'::regnamespace) then
      execute 'create policy "staff read sms_log" on public.sms_log for select using (public.is_staff())';
    end if;
  end if;
end $$;

comment on table public.sms_log is 'Outbound SMS sent from the admin console (khudebarta.com gateway).';
