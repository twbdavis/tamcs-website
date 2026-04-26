-- 0013_meets.sql
-- Upcoming meets feed: travel, signups, attachments, etc. Distinct from
-- meet_results (historical results) introduced in 0002.
--
-- Public read covers published rows; officers and above can read drafts and
-- manage every column.
--
-- Safe to re-run.

create table if not exists public.meets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meet_date date not null,
  location text not null,
  description text,
  signup_url text,
  signup_deadline timestamptz,
  travel_info text,
  warmup_time text,
  event_start_time text,
  attachments_urls jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meets_date_idx on public.meets (meet_date);
create index if not exists meets_published_date_idx
  on public.meets (is_published, meet_date);

drop trigger if exists meets_touch_updated_at on public.meets;
create trigger meets_touch_updated_at
  before update on public.meets
  for each row execute function public.touch_updated_at();

alter table public.meets enable row level security;

-- Anyone can read a published meet.
drop policy if exists "meets public read published" on public.meets;
create policy "meets public read published"
  on public.meets for select
  using (is_published = true);

-- Officers and above can read everything (including drafts).
drop policy if exists "meets officer+ read all" on public.meets;
create policy "meets officer+ read all"
  on public.meets for select
  using (public.has_role_at_least('officer'));

drop policy if exists "meets officer+ insert" on public.meets;
create policy "meets officer+ insert"
  on public.meets for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "meets officer+ update" on public.meets;
create policy "meets officer+ update"
  on public.meets for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "meets officer+ delete" on public.meets;
create policy "meets officer+ delete"
  on public.meets for delete
  using (public.has_role_at_least('officer'));
