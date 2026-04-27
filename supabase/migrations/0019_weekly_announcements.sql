-- 0019_weekly_announcements.sql
-- Weekly announcements ingested from inbound email (via the ingest-email
-- edge function) or created manually by officers as a fallback.
--
-- Permission model:
--   SELECT  : authenticated users see published rows; officers+ see drafts
--   INSERT  : officers+ (manual fallback). The edge function uses the
--             service role key, which bypasses RLS automatically.
--   UPDATE  : officers+ (edit content, toggle is_published)
--   DELETE  : officers+
--
-- Safe to re-run.

create table if not exists public.weekly_announcements (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  body_html text,
  sender text,
  received_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weekly_announcements_received_idx
  on public.weekly_announcements (received_at desc);
create index if not exists weekly_announcements_published_received_idx
  on public.weekly_announcements (is_published, received_at desc);

drop trigger if exists weekly_announcements_touch_updated_at
  on public.weekly_announcements;
create trigger weekly_announcements_touch_updated_at
  before update on public.weekly_announcements
  for each row execute function public.touch_updated_at();

alter table public.weekly_announcements enable row level security;

drop policy if exists "announcements authed read published"
  on public.weekly_announcements;
create policy "announcements authed read published"
  on public.weekly_announcements for select
  to authenticated
  using (is_published = true);

drop policy if exists "announcements officer+ read all"
  on public.weekly_announcements;
create policy "announcements officer+ read all"
  on public.weekly_announcements for select
  using (public.has_role_at_least('officer'));

drop policy if exists "announcements officer+ insert"
  on public.weekly_announcements;
create policy "announcements officer+ insert"
  on public.weekly_announcements for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "announcements officer+ update"
  on public.weekly_announcements;
create policy "announcements officer+ update"
  on public.weekly_announcements for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "announcements officer+ delete"
  on public.weekly_announcements;
create policy "announcements officer+ delete"
  on public.weekly_announcements for delete
  using (public.has_role_at_least('officer'));
