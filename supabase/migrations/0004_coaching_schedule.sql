-- 0004_coaching_schedule.sql
-- The coaching schedule: a mix of weekly recurring practices/dryland/etc. and
-- one-off events. Replaces the date-only schedule_events table from 0002.
--
-- Public read; president-only write. Officers and admins can see it via the
-- public read policy but cannot edit it (RLS rejects their writes).
--
-- Safe to re-run.

-- ─── type enum ──────────────────────────────────────────────────────────────
do $$
begin
  create type public.coaching_schedule_type as enum
    ('practice', 'dryland', 'meeting', 'social');
exception
  when duplicate_object then null;
end $$;

-- ─── day-of-week enum (0 = Sunday, 6 = Saturday) ───────────────────────────
-- Stored as a check-constrained smallint so callers can use familiar JS Date#getDay
-- semantics without a separate type.

create table if not exists public.coaching_schedule (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  day_of_week smallint
    check (day_of_week is null or (day_of_week between 0 and 6)),
  start_time time not null,
  end_time time not null,
  location text,
  type public.coaching_schedule_type not null default 'practice',
  notes text,
  recurring boolean not null default true,
  specific_date date,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coaching_schedule_end_after_start check (end_time > start_time),
  constraint coaching_schedule_recurring_shape check (
    (recurring = true  and day_of_week is not null and specific_date is null) or
    (recurring = false and specific_date is not null)
  )
);

create index if not exists coaching_schedule_recurring_dow_idx
  on public.coaching_schedule (day_of_week)
  where recurring = true;

create index if not exists coaching_schedule_one_off_date_idx
  on public.coaching_schedule (specific_date)
  where recurring = false;

drop trigger if exists coaching_schedule_touch_updated_at on public.coaching_schedule;
create trigger coaching_schedule_touch_updated_at
  before update on public.coaching_schedule
  for each row execute function public.touch_updated_at();

-- ─── RLS: public read, president-only write ────────────────────────────────
alter table public.coaching_schedule enable row level security;

drop policy if exists "coaching_schedule public read" on public.coaching_schedule;
create policy "coaching_schedule public read"
  on public.coaching_schedule for select
  using (true);

drop policy if exists "coaching_schedule president insert" on public.coaching_schedule;
create policy "coaching_schedule president insert"
  on public.coaching_schedule for insert
  with check (public.is_president());

drop policy if exists "coaching_schedule president update" on public.coaching_schedule;
create policy "coaching_schedule president update"
  on public.coaching_schedule for update
  using (public.is_president())
  with check (public.is_president());

drop policy if exists "coaching_schedule president delete" on public.coaching_schedule;
create policy "coaching_schedule president delete"
  on public.coaching_schedule for delete
  using (public.is_president());

-- ─── retire the old schedule_events table ───────────────────────────────────
-- The new coaching_schedule supersedes the date-only events table from 0002.
-- No data is in production yet, so a hard drop is safe; the supersession is
-- recorded here for migration history.
drop table if exists public.schedule_events cascade;
do $$
begin
  drop type if exists public.schedule_type;
exception when others then null;
end $$;
