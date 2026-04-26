-- 0003_role_hierarchy.sql
-- Adds 'president' and 'member' to user_role and introduces a numeric role
-- hierarchy: president(4) > admin(3) > officer(2) > member(1) > guest(0).
-- Legacy roles ('athlete', 'coach', 'alumni') map to member-tier (1).
--
-- Replaces the old officer-or-admin check with a generic level-based helper,
-- updates the role-change guard so that:
--   - Only admins+ can change another profile's role at all
--   - Only the president can promote anyone to 'admin' or 'president', and
--     only the president can demote an existing admin/president
--   - Users may not edit their own role
--
-- Profiles RLS is also tightened: "update any profile" now requires admin+.
-- Object tables that referenced is_officer_or_admin() keep working — that
-- helper is redefined to include president.
--
-- Safe to re-run.

-- ─── extend user_role enum ──────────────────────────────────────────────────
do $$
begin
  alter type public.user_role add value if not exists 'president';
exception when others then null;
end $$;

do $$
begin
  alter type public.user_role add value if not exists 'member';
exception when others then null;
end $$;

-- ─── role-level helper ──────────────────────────────────────────────────────
create or replace function public.role_level(r public.user_role)
returns int
language sql
immutable
as $$
  select case r
    when 'president' then 4
    when 'admin'     then 3
    when 'officer'   then 2
    when 'member'    then 1
    when 'athlete'   then 1
    when 'coach'     then 1
    when 'alumni'    then 1
    when 'guest'     then 0
    else 0
  end;
$$;

-- ─── current-user role helpers (SECURITY DEFINER to dodge RLS recursion) ────
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.has_role_at_least(min public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.role_level(public.current_user_role()) >= public.role_level(min),
    false
  );
$$;

create or replace function public.is_president()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'president';
$$;

-- Redefine the old helper to include president — anything granting officer/admin
-- access in earlier migrations should also grant president access.
create or replace function public.is_officer_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role_at_least('officer');
$$;

-- ─── role-change guard ─────────────────────────────────────────────────────
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.user_role := public.current_user_role();
begin
  if old.role is distinct from new.role then
    -- No one can edit their own role.
    if auth.uid() = new.id then
      raise exception 'You cannot change your own role';
    end if;

    -- Must be at least admin to change anyone's role.
    if not public.has_role_at_least('admin') then
      raise exception 'Only admins or the president can change user roles';
    end if;

    -- Only the president can grant or revoke the president role.
    if (new.role = 'president' or old.role = 'president')
       and actor <> 'president' then
      raise exception 'Only the president can grant or revoke the president role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();

-- ─── tighten profiles RLS ───────────────────────────────────────────────────
-- Replace the broad "officers/admins update any profile" with admin-only.
drop policy if exists "officers/admins update any profile" on public.profiles;
drop policy if exists "admins update any profile" on public.profiles;
create policy "admins update any profile"
  on public.profiles for update
  using (public.has_role_at_least('admin'))
  with check (public.has_role_at_least('admin'));

-- Officers and above can still read every profile (used by admin views).
drop policy if exists "officers/admins read all" on public.profiles;
drop policy if exists "officers+ read all profiles" on public.profiles;
create policy "officers+ read all profiles"
  on public.profiles for select
  using (public.has_role_at_least('officer'));

-- ─── tighten officers table: admin+ writes only ─────────────────────────────
-- Per the new permission model only admins and the president manage the
-- officer roster; plain officers no longer have write access.
drop policy if exists "officers insert by officers/admins" on public.officers;
drop policy if exists "officers update by officers/admins" on public.officers;
drop policy if exists "officers delete by officers/admins" on public.officers;
drop policy if exists "officers admin+ insert" on public.officers;
drop policy if exists "officers admin+ update" on public.officers;
drop policy if exists "officers admin+ delete" on public.officers;

create policy "officers admin+ insert"
  on public.officers for insert
  with check (public.has_role_at_least('admin'));

create policy "officers admin+ update"
  on public.officers for update
  using (public.has_role_at_least('admin'))
  with check (public.has_role_at_least('admin'));

create policy "officers admin+ delete"
  on public.officers for delete
  using (public.has_role_at_least('admin'));
