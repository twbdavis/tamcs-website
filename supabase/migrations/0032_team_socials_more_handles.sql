-- 0032_team_socials_more_handles.sql
-- Brings Snapchat back and adds LinkedIn to the settings/team-socials
-- flow. Both default to off (privacy-first). Refreshes the directory
-- RPC to surface the new fields.
--
-- Safe to re-run.

alter table public.profiles
  add column if not exists snapchat_handle text;
alter table public.profiles
  add column if not exists linkedin_handle text;
alter table public.profiles
  add column if not exists show_snapchat boolean not null default false;
alter table public.profiles
  add column if not exists show_linkedin boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_snapchat_handle_valid;
alter table public.profiles
  add constraint profiles_snapchat_handle_valid
  check (snapchat_handle is null or length(snapchat_handle) <= 60);

alter table public.profiles
  drop constraint if exists profiles_linkedin_handle_valid;
alter table public.profiles
  add constraint profiles_linkedin_handle_valid
  check (linkedin_handle is null or length(linkedin_handle) <= 200);

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
  where p.onboarding_completed = true
    and p.account_approved = true
    and (
      coalesce(p.show_phone, false)
      or coalesce(p.show_instagram, false)
      or coalesce(p.show_snapchat, false)
      or coalesce(p.show_linkedin, false)
    )
  order by lower(p.last_name), lower(p.first_name);
$$;

grant execute on function public.team_socials_directory() to authenticated;
