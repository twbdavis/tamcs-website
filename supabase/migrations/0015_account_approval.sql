-- 0015_account_approval.sql
-- Adds account_approved gate. New athletes finish onboarding in a pending
-- state and stay locked out of the dashboard until an officer approves
-- them. Coaches/officers/admin/president are not gated.
--
-- Existing members are backfilled to approved=true so this migration does
-- not lock anyone out retroactively.
--
-- Profile self-read (so an unapproved user can fetch their own row to
-- render the waiting page) is already in place from 0001's "read own
-- profile" policy.
--
-- Safe to re-run.

alter table public.profiles
  add column if not exists account_approved boolean not null default false;

-- Backfill: everyone already on the team is approved. New rows default to
-- false (the column default), so this only flips existing rows once.
update public.profiles
set account_approved = true
where account_approved = false
  and (onboarding_completed = true or role <> 'athlete');

create index if not exists profiles_pending_approval_idx
  on public.profiles (account_approved, onboarding_completed)
  where account_approved = false and onboarding_completed = true;
