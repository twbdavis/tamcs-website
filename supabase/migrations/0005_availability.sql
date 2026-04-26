-- 0005_availability.sql
-- Officer meeting availability: each row is one (user, day, time-block) entry.
-- Officers and above can read everyone's availability; they can only mutate
-- their own rows.
--
-- Safe to re-run.

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week text not null
    check (day_of_week in (
      'monday','tuesday','wednesday','thursday',
      'friday','saturday','sunday'
    )),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_end_after_start check (end_time > start_time)
);

create index if not exists availability_user_idx
  on public.availability (user_id);
create index if not exists availability_day_idx
  on public.availability (day_of_week);

drop trigger if exists availability_touch_updated_at on public.availability;
create trigger availability_touch_updated_at
  before update on public.availability
  for each row execute function public.touch_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.availability enable row level security;

-- Officers and above can read every row.
drop policy if exists "availability officers+ read" on public.availability;
create policy "availability officers+ read"
  on public.availability for select
  using (public.has_role_at_least('officer'));

-- Officers and above can insert rows, but only for themselves.
drop policy if exists "availability self insert" on public.availability;
create policy "availability self insert"
  on public.availability for insert
  with check (
    public.has_role_at_least('officer')
    and user_id = auth.uid()
  );

-- Same for updates: must be own row, both before and after.
drop policy if exists "availability self update" on public.availability;
create policy "availability self update"
  on public.availability for update
  using (
    public.has_role_at_least('officer')
    and user_id = auth.uid()
  )
  with check (
    public.has_role_at_least('officer')
    and user_id = auth.uid()
  );

-- And deletes.
drop policy if exists "availability self delete" on public.availability;
create policy "availability self delete"
  on public.availability for delete
  using (
    public.has_role_at_least('officer')
    and user_id = auth.uid()
  );
