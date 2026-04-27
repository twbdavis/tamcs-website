-- 0031_team_socials_directory.sql
-- Athlete-facing team directory: each athlete chooses, on their settings
-- page, which contact field they want visible to teammates. Defaults are
-- privacy-first (everything off) so nothing leaks until the user opts in.
--
-- The team_socials_directory() RPC is the only path athletes use to read
-- other profiles. It runs SECURITY DEFINER and returns ONLY the columns
-- each athlete has opted into; profiles RLS for plain SELECT stays
-- locked down (own row + officer+).
--
-- Safe to re-run.

alter table public.profiles
  add column if not exists show_phone boolean not null default false;
alter table public.profiles
  add column if not exists show_instagram boolean not null default false;

create or replace function public.team_socials_directory()
returns table (
  id               uuid,
  first_name       text,
  last_name        text,
  class_year       text,
  phone_number     text,
  instagram_handle text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.first_name,
    p.last_name,
    p.class_year,
    case when coalesce(p.show_phone, false)     then p.phone_number     else null end,
    case when coalesce(p.show_instagram, false) then p.instagram_handle else null end
  from public.profiles p
  where p.onboarding_completed = true
    and p.account_approved = true
    and (
      coalesce(p.show_phone, false)
      or coalesce(p.show_instagram, false)
    )
  order by lower(p.last_name), lower(p.first_name);
$$;

grant execute on function public.team_socials_directory() to authenticated;
