-- 0023_email_list_dues.sql
-- Adds dues tracking to the team email list. Each entry records whether
-- they're paying full-year or per-semester dues (nullable for people not
-- expected to pay) and a separate boolean for whether the dues have been
-- received yet.
--
-- Safe to re-run.

alter table public.email_list
  add column if not exists dues_type text;

alter table public.email_list
  drop constraint if exists email_list_dues_type_valid;
alter table public.email_list
  add constraint email_list_dues_type_valid
  check (dues_type is null or dues_type in ('full_year', 'semester'));

alter table public.email_list
  add column if not exists dues_paid boolean not null default false;

create index if not exists email_list_dues_paid_idx
  on public.email_list (dues_paid);
