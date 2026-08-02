-- 0008: Permanent family/group linking for pilgrims & passengers.
-- Members point at their group head (another row in the same table). The head
-- row keeps group_head_id NULL. Deleting a head detaches the members.

alter table public.hajj_pilgrims
  add column if not exists group_head_id uuid references public.hajj_pilgrims(id) on delete set null;

alter table public.umrah_passengers
  add column if not exists group_head_id uuid references public.umrah_passengers(id) on delete set null;

create index if not exists hajj_pilgrims_group_head_idx on public.hajj_pilgrims (group_head_id);
create index if not exists umrah_passengers_group_head_idx on public.umrah_passengers (group_head_id);
