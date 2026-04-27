-- 0025_attendance.sql
-- Practice attendance tracker. Officers paste a roll-call list at the end
-- of each practice; athletes see their own attendance history.
--
-- Permission model:
--   attendance_sessions
--     SELECT  : any authenticated user (sessions only carry date/title/semester)
--     INSERT/UPDATE/DELETE : officer+
--   attendance_records
--     SELECT  : officer+ all rows; an athlete sees rows that match them
--               (UIN last-4 if their profile has a UIN, else full-name match)
--     INSERT/UPDATE/DELETE : officer+
--
-- Safe to re-run.

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  title text not null default 'Practice',
  semester text not null check (semester in ('Fall', 'Spring', 'Summer')),
  academic_year text not null check (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists attendance_sessions_date_idx
  on public.attendance_sessions (session_date desc);
create index if not exists attendance_sessions_semester_year_idx
  on public.attendance_sessions (academic_year, semester, session_date desc);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  athlete_name text not null,
  uin_last4 text check (uin_last4 is null or uin_last4 ~ '^[0-9]{4}$'),
  is_restricted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists attendance_records_session_idx
  on public.attendance_records (session_id);
create index if not exists attendance_records_athlete_idx
  on public.attendance_records (lower(athlete_name));
create index if not exists attendance_records_uin_idx
  on public.attendance_records (uin_last4)
  where uin_last4 is not null;

-- ─── helper SQL functions for semester / academic year ─────────────────────
create or replace function public.attendance_semester_for(d date)
returns text
language sql
immutable
as $$
  select case
    when extract(month from d) between 1 and 5  then 'Spring'
    when extract(month from d) between 6 and 7  then 'Summer'
    else 'Fall'
  end;
$$;

create or replace function public.attendance_academic_year_for(d date)
returns text
language sql
immutable
as $$
  select case
    when extract(month from d) >= 8 then
      extract(year from d)::int || '-' || (extract(year from d)::int + 1)
    else
      (extract(year from d)::int - 1) || '-' || extract(year from d)::int
  end;
$$;

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records  enable row level security;

drop policy if exists "attendance_sessions read authed" on public.attendance_sessions;
create policy "attendance_sessions read authed"
  on public.attendance_sessions for select
  to authenticated
  using (true);

drop policy if exists "attendance_sessions officer+ insert" on public.attendance_sessions;
create policy "attendance_sessions officer+ insert"
  on public.attendance_sessions for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "attendance_sessions officer+ update" on public.attendance_sessions;
create policy "attendance_sessions officer+ update"
  on public.attendance_sessions for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "attendance_sessions officer+ delete" on public.attendance_sessions;
create policy "attendance_sessions officer+ delete"
  on public.attendance_sessions for delete
  using (public.has_role_at_least('officer'));

drop policy if exists "attendance_records officer+ read all" on public.attendance_records;
create policy "attendance_records officer+ read all"
  on public.attendance_records for select
  using (public.has_role_at_least('officer'));

drop policy if exists "attendance_records read own" on public.attendance_records;
create policy "attendance_records read own"
  on public.attendance_records for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.uin is not null and uin_last4 is not null and uin_last4 = right(p.uin, 4))
          or (
            p.full_name is not null
            and lower(athlete_name) = lower(p.full_name)
          )
        )
    )
  );

drop policy if exists "attendance_records officer+ insert" on public.attendance_records;
create policy "attendance_records officer+ insert"
  on public.attendance_records for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "attendance_records officer+ update" on public.attendance_records;
create policy "attendance_records officer+ update"
  on public.attendance_records for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "attendance_records officer+ delete" on public.attendance_records;
create policy "attendance_records officer+ delete"
  on public.attendance_records for delete
  using (public.has_role_at_least('officer'));
