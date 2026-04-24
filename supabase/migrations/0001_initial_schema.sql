-- 0001_initial_schema.sql
-- Creates the profiles table, user_role enum, auto-profile trigger,
-- role-change guard, and RLS policies.
--
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS / CREATE OR REPLACE.

-- ─── user_role enum ──────────────────────────────────────────────────────────
do $$
begin
  create type public.user_role as enum
    ('athlete', 'coach', 'officer', 'admin', 'alumni', 'guest');
exception
  when duplicate_object then null;
end $$;

-- ─── profiles table ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'guest',
  year text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── updated_at touch trigger ────────────────────────────────────────────────
create or replace function public.handle_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_profile_updated_at();

-- ─── auto-create profile on auth.users insert ────────────────────────────────
-- Picks up full_name from signup options.data.full_name (stored in raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── helper: is current user officer/admin ───────────────────────────────────
-- SECURITY DEFINER avoids RLS recursion when called from within a profiles policy.
create or replace function public.is_officer_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('officer', 'admin')
  );
$$;

-- ─── guard: only officers/admins may change a role ───────────────────────────
-- RLS policies can't reference OLD, so role protection is enforced here.
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_officer_or_admin() then
    raise exception 'Only officers or admins can change user roles';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "officers/admins read all" on public.profiles;
create policy "officers/admins read all"
  on public.profiles for select
  using (public.is_officer_or_admin());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "officers/admins update any profile" on public.profiles;
create policy "officers/admins update any profile"
  on public.profiles for update
  using (public.is_officer_or_admin())
  with check (public.is_officer_or_admin());

-- No INSERT policy: inserts happen via handle_new_user (SECURITY DEFINER trigger).
-- No DELETE policy: profiles cascade-delete from auth.users.
