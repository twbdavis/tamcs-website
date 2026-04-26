-- 0008_coach_assignments.sql
-- Reframes the coaching schedule from "edit practice times" to "assign
-- coaches to fixed practices". Adds:
--   - effective_from / effective_to to coaching_schedule so a recurring
--     practice can be scoped to a date range (e.g. starts Sep 1, 2026).
--   - public.coaches: a roster the president maintains.
--   - public.coaching_schedule_coaches: junction table assigning coaches to
--     specific practices.
--
-- Also seeds the spring kickoff (Apr 27 + 28, 2026) and the recurring
-- Mon–Thu 7:30 PM practices that resume Sep 1, 2026 at the TAMU Natatorium.
--
-- Safe to re-run.

-- ─── coaching_schedule: effective date range ────────────────────────────────
alter table public.coaching_schedule
  add column if not exists effective_from date;
alter table public.coaching_schedule
  add column if not exists effective_to date;

-- ─── coaches roster ─────────────────────────────────────────────────────────
create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  profile_id uuid references public.profiles(id) on delete set null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists coaches_touch_updated_at on public.coaches;
create trigger coaches_touch_updated_at
  before update on public.coaches
  for each row execute function public.touch_updated_at();

alter table public.coaches enable row level security;

drop policy if exists "coaches public read" on public.coaches;
create policy "coaches public read"
  on public.coaches for select
  using (true);

drop policy if exists "coaches president insert" on public.coaches;
create policy "coaches president insert"
  on public.coaches for insert
  with check (public.is_president());

drop policy if exists "coaches president update" on public.coaches;
create policy "coaches president update"
  on public.coaches for update
  using (public.is_president())
  with check (public.is_president());

drop policy if exists "coaches president delete" on public.coaches;
create policy "coaches president delete"
  on public.coaches for delete
  using (public.is_president());

-- ─── junction: assignments ──────────────────────────────────────────────────
create table if not exists public.coaching_schedule_coaches (
  schedule_id uuid not null references public.coaching_schedule(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (schedule_id, coach_id)
);

create index if not exists coaching_schedule_coaches_schedule_idx
  on public.coaching_schedule_coaches (schedule_id);
create index if not exists coaching_schedule_coaches_coach_idx
  on public.coaching_schedule_coaches (coach_id);

alter table public.coaching_schedule_coaches enable row level security;

drop policy if exists "coach_assignments public read" on public.coaching_schedule_coaches;
create policy "coach_assignments public read"
  on public.coaching_schedule_coaches for select
  using (true);

drop policy if exists "coach_assignments president insert" on public.coaching_schedule_coaches;
create policy "coach_assignments president insert"
  on public.coaching_schedule_coaches for insert
  with check (public.is_president());

drop policy if exists "coach_assignments president delete" on public.coaching_schedule_coaches;
create policy "coach_assignments president delete"
  on public.coaching_schedule_coaches for delete
  using (public.is_president());

-- ─── seed: practices ────────────────────────────────────────────────────────
-- Idempotent via deterministic UUIDs.
-- day_of_week uses JS Date#getDay() semantics: Sun=0, Mon=1, … Sat=6.
-- Two one-off kickoff practices (Apr 27 + Apr 28, 2026), then a four-day-a-week
-- recurring schedule that picks back up Sep 1, 2026.

insert into public.coaching_schedule
  (id, title, day_of_week, start_time, end_time, location, type,
   recurring, specific_date, effective_from, effective_to,
   notes, display_order)
values
  -- Spring kickoff
  (md5('practice-2026-04-27')::uuid,
   'Practice', null, '19:30', '21:00', 'TAMU Natatorium', 'practice',
   false, date '2026-04-27', null, null,
   'Spring kickoff', 1),
  (md5('practice-2026-04-28')::uuid,
   'Practice', null, '19:30', '21:00', 'TAMU Natatorium', 'practice',
   false, date '2026-04-28', null, null,
   'Spring kickoff', 2),

  -- Fall semester: Mon-Thu, starting Sep 1, 2026
  (md5('practice-fall-mon')::uuid,
   'Monday practice', 1, '19:30', '21:00', 'TAMU Natatorium', 'practice',
   true, null, date '2026-09-01', null,
   null, 10),
  (md5('practice-fall-tue')::uuid,
   'Tuesday practice', 2, '19:30', '21:00', 'TAMU Natatorium', 'practice',
   true, null, date '2026-09-01', null,
   null, 11),
  (md5('practice-fall-wed')::uuid,
   'Wednesday practice', 3, '19:30', '21:00', 'TAMU Natatorium', 'practice',
   true, null, date '2026-09-01', null,
   null, 12),
  (md5('practice-fall-thu')::uuid,
   'Thursday practice', 4, '19:30', '21:00', 'TAMU Natatorium', 'practice',
   true, null, date '2026-09-01', null,
   null, 13)
on conflict (id) do nothing;
