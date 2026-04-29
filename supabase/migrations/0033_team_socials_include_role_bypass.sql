-- 0033_team_socials_include_role_bypass.sql
-- The team_socials_directory() RPC filtered on onboarding_completed,
-- which excludes officers/admin/president/coach/alumni — those roles
-- bypass the athlete onboarding form, so the flag stays false for them.
-- Loosen the filter to also include role-bypass profiles, mirroring the
-- bypassesOnboarding() logic in middleware.
--
-- Safe to re-run.

create or replace function public.team_socials_directory()
returns table (
  id               uuid,
  first_name       text,
  last_name        text,
  class_year       text,
  phone_number     text,
  instagram_handle text,
  snapchat_handle  text,
  linkedin_handle  text
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
    case when coalesce(p.show_instagram, false) then p.instagram_handle else null end,
    case when coalesce(p.show_snapchat, false)  then p.snapchat_handle  else null end,
    case when coalesce(p.show_linkedin, false)  then p.linkedin_handle  else null end
  from public.profiles p
  where p.account_approved = true
    and (
      p.onboarding_completed = true
      or p.role in ('officer', 'admin', 'president', 'coach', 'alumni')
    )
    and (
      coalesce(p.show_phone, false)
      or coalesce(p.show_instagram, false)
      or coalesce(p.show_snapchat, false)
      or coalesce(p.show_linkedin, false)
    )
  order by lower(p.last_name), lower(p.first_name);
$$;

grant execute on function public.team_socials_directory() to authenticated;
