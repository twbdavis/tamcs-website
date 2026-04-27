-- 0022_email_list_simplify_categories.sql
-- Drops 'alumni' and 'parent' from the email_list category enum. Existing
-- rows in those categories are folded into 'other'. Also updates the
-- role→category mapping function so alumni profiles flow into 'other'.
--
-- Safe to re-run.

-- Move legacy rows to 'other' before tightening the check constraint.
update public.email_list
set category = 'other'
where category in ('alumni', 'parent');

-- Replace the check constraint. Drop both possible historical names so
-- this is safe whether 0021 used the auto-named one or not.
alter table public.email_list
  drop constraint if exists email_list_category_check;

alter table public.email_list
  add constraint email_list_category_check
  check (category in ('athlete', 'officer', 'coach', 'other'));

-- Role→category mapping: alumni and any other non-athlete/non-coach
-- roles fall into 'other'. (member/guest already did.)
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
    else 'other'
  end;
$$;
