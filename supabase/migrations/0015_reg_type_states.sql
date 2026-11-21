-- 0015 — Hajj registration type: add "cancelled" and "archived".
--
-- hajj_pilgrims.reg_type used to allow only 'pre-registration' / 'registered'.
-- The pilgrim form now offers the four states of the national Hajj system:
-- Pre-Registered, Registered, Cancelled, Archived. Safe to re-run.

alter table public.hajj_pilgrims
  drop constraint if exists hajj_pilgrims_reg_type_check;

alter table public.hajj_pilgrims
  add constraint hajj_pilgrims_reg_type_check
  check (reg_type in ('pre-registration', 'registered', 'cancelled', 'archived'));
