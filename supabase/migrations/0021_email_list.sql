-- 0021_email_list.sql
-- Team email-list spreadsheet. Officers manage the list directly;
-- a trigger keeps it in sync with the profiles table on approval and
-- role-change events.
--
-- Permission model:
--   SELECT  : officer+ sees everything; an athlete sees only the row that
--             matches their own email
--   INSERT  : officer+
--   UPDATE  : officer+
--   DELETE  : officer+
--   The sync trigger runs as SECURITY DEFINER so it bypasses RLS and
--   keeps the list current regardless of who triggered the profile change.
--
-- Safe to re-run.

create table if not exists public.email_list (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  last_name text,
  category text not null default 'athlete'
    check (category in ('athlete','officer','coach','alumni','parent','other')),
  is_active boolean not null default true,
  added_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_list_category_idx
  on public.email_list (category);
create index if not exists email_list_active_idx
  on public.email_list (is_active);
create index if not exists email_list_last_first_idx
  on public.email_list (last_name, first_name);

drop trigger if exists email_list_touch_updated_at on public.email_list;
create trigger email_list_touch_updated_at
  before update on public.email_list
  for each row execute function public.touch_updated_at();

-- Lowercase emails on the way in so the UNIQUE constraint is effectively
-- case-insensitive, and the application can compare without normalizing.
create or replace function public.email_list_lowercase_email()
returns trigger
language plpgsql
as $$
begin
  if new.email is not null then
    new.email := lower(new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists email_list_lowercase_email on public.email_list;
create trigger email_list_lowercase_email
  before insert or update on public.email_list
  for each row execute function public.email_list_lowercase_email();

alter table public.email_list enable row level security;

drop policy if exists "email_list officer+ read all" on public.email_list;
create policy "email_list officer+ read all"
  on public.email_list for select
  using (public.has_role_at_least('officer'));

drop policy if exists "email_list read own" on public.email_list;
create policy "email_list read own"
  on public.email_list for select
  using (
    email = (
      select lower(p.email) from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "email_list officer+ insert" on public.email_list;
create policy "email_list officer+ insert"
  on public.email_list for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "email_list officer+ update" on public.email_list;
create policy "email_list officer+ update"
  on public.email_list for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "email_list officer+ delete" on public.email_list;
create policy "email_list officer+ delete"
  on public.email_list for delete
  using (public.has_role_at_least('officer'));

-- ─── auto-sync from profiles ───────────────────────────────────────────────
-- Maps a profile role onto an email_list category.
create or replace function public._email_list_category_from_role(r public.user_role)
returns text
language sql
immutable
as $$
  select case r
    when 'athlete'   then 'athlete'
    when 'officer'   then 'officer'
    when 'admin'     then 'officer'
    when 'president' then 'officer'
    when 'coach'     then 'coach'
    when 'alumni'    then 'alumni'
    else 'other'
  end;
$$;

create or replace function public.sync_email_list_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cat text;
  profile_email text;
begin
  if new.email is null or new.email = '' then
    return new;
  end if;

  cat := public._email_list_category_from_role(new.role);
  profile_email := lower(new.email);

  -- New approval (or insert that already arrives approved) → upsert into
  -- the email list. Existing manual entries with the same email get
  -- their category synced and any missing names filled in.
  if (tg_op = 'INSERT' and new.account_approved is true) or
     (tg_op = 'UPDATE'
      and coalesce(old.account_approved, false) = false
      and new.account_approved is true) then
    insert into public.email_list (email, first_name, last_name, category, added_by)
    values (profile_email, new.first_name, new.last_name, cat, new.id)
    on conflict (email) do update set
      category   = excluded.category,
      first_name = coalesce(public.email_list.first_name, excluded.first_name),
      last_name  = coalesce(public.email_list.last_name, excluded.last_name),
      is_active  = true;
  end if;

  -- Role change for an already-listed approved profile → keep category
  -- in sync.
  if tg_op = 'UPDATE' and old.role is distinct from new.role then
    update public.email_list
    set category = cat
    where email = profile_email;
  end if;

  -- Email change on the profile → carry the rename through the list.
  if tg_op = 'UPDATE' and lower(coalesce(old.email, '')) is distinct from profile_email then
    update public.email_list
    set email = profile_email
    where email = lower(coalesce(old.email, ''));
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_sync_email_list on public.profiles;
create trigger profiles_sync_email_list
  after insert or update of role, account_approved, email, first_name, last_name
  on public.profiles
  for each row execute function public.sync_email_list_from_profile();
