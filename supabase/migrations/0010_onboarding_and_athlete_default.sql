-- 0010_onboarding_and_athlete_default.sql
-- Switches the default role for new accounts from 'guest' to 'athlete' and
-- adds the columns required by the onboarding form. Also reshuffles the
-- role hierarchy so coach sits between officer and athlete:
--   president(5) > admin(4) > officer(3) > coach(2) > athlete(1) > guest(0)
--
-- Safe to re-run.

-- ─── athlete default ────────────────────────────────────────────────────────
alter table public.profiles
  alter column role set default 'athlete';

-- New-user trigger should stamp the default explicitly so the role can't be
-- overridden by a stray client supplying raw_user_meta_data.role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    'athlete'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ─── onboarding columns ────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists first_name text;
alter table public.profiles
  add column if not exists last_name text;
alter table public.profiles
  add column if not exists birthday date;
alter table public.profiles
  add column if not exists class_year text;
alter table public.profiles
  add column if not exists uin text;
alter table public.profiles
  add column if not exists constitution_agreed boolean not null default false;
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

-- 9-digit UIN (TAMU University Identification Number).
alter table public.profiles
  drop constraint if exists profiles_uin_format;
alter table public.profiles
  add constraint profiles_uin_format
  check (uin is null or uin ~ '^[0-9]{9}$');

alter table public.profiles
  drop constraint if exists profiles_class_year_valid;
alter table public.profiles
  add constraint profiles_class_year_valid
  check (class_year is null or class_year in (
    'Freshman', 'Sophomore', 'Junior', 'Senior', '5th Year', 'Graduate'
  ));

-- ─── role hierarchy: coach above athlete ───────────────────────────────────
create or replace function public.role_level(r public.user_role)
returns int
language sql
immutable
as $$
  select case r
    when 'president' then 5
    when 'admin'     then 4
    when 'officer'   then 3
    when 'coach'     then 2
    when 'athlete'   then 1
    when 'member'    then 1
    when 'alumni'    then 1
    when 'guest'     then 0
    else 0
  end;
$$;
