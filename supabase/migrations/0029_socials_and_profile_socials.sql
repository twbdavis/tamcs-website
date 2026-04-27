-- 0029_socials_and_profile_socials.sql
-- Team socials feature: officers plan team socials, athletes browse them,
-- and the public Schedule page surfaces them alongside practices.
--
-- Also adds optional Instagram and Snapchat handles to profiles so the
-- roster/onboarding flow can collect them.
--
-- Permission model for socials:
--   SELECT  : public (anyone) for is_published = true; officer+ for everything
--   INSERT  : officer+
--   UPDATE  : officer+
--   DELETE  : officer+
--
-- Safe to re-run.

-- ─── socials table ─────────────────────────────────────────────────────────
create table if not exists public.socials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  event_time text,
  location text,
  created_by uuid references public.profiles(id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists socials_date_idx on public.socials (event_date);
create index if not exists socials_published_date_idx
  on public.socials (is_published, event_date);

drop trigger if exists socials_touch_updated_at on public.socials;
create trigger socials_touch_updated_at
  before update on public.socials
  for each row execute function public.touch_updated_at();

alter table public.socials enable row level security;

drop policy if exists "socials public read published" on public.socials;
create policy "socials public read published"
  on public.socials for select
  using (is_published = true);

drop policy if exists "socials officer+ read all" on public.socials;
create policy "socials officer+ read all"
  on public.socials for select
  using (public.has_role_at_least('officer'));

drop policy if exists "socials officer+ insert" on public.socials;
create policy "socials officer+ insert"
  on public.socials for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "socials officer+ update" on public.socials;
create policy "socials officer+ update"
  on public.socials for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "socials officer+ delete" on public.socials;
create policy "socials officer+ delete"
  on public.socials for delete
  using (public.has_role_at_least('officer'));

-- ─── profile social handles ────────────────────────────────────────────────
alter table public.profiles
  add column if not exists instagram_handle text;
alter table public.profiles
  add column if not exists snapchat_handle text;

-- Permissive shape checks: optional, alphanumerics + a few punctuation.
alter table public.profiles
  drop constraint if exists profiles_instagram_handle_valid;
alter table public.profiles
  add constraint profiles_instagram_handle_valid
  check (instagram_handle is null or length(instagram_handle) <= 60);

alter table public.profiles
  drop constraint if exists profiles_snapchat_handle_valid;
alter table public.profiles
  add constraint profiles_snapchat_handle_valid
  check (snapchat_handle is null or length(snapchat_handle) <= 60);
