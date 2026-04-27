-- 0016_phone_and_officer_roster_edit.sql
-- Adds a phone number to profiles (collected during onboarding) and lets
-- officers — not just admin+ — edit any non-role profile field. The
-- existing guard_profile_role_change trigger still prevents officers from
-- escalating roles, so this only opens up the rest of the fields.
--
-- Safe to re-run.

-- ─── phone_number column ────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists phone_number text;

-- Basic shape check: if present, the digit count should be 7–15. Keeps the
-- column permissive so users can store +1 (979) 555-0100 or 9795550100.
alter table public.profiles
  drop constraint if exists profiles_phone_number_valid;
alter table public.profiles
  add constraint profiles_phone_number_valid
  check (
    phone_number is null
    or length(regexp_replace(phone_number, '\D', '', 'g')) between 7 and 15
  );

-- ─── relax profile update RLS to officer+ ──────────────────────────────────
-- The role-change trigger blocks officers from actually changing the role
-- column, so this is safe. Officers can edit name, birthday, contact info,
-- etc.; only admin+ can promote/demote.
drop policy if exists "admins update any profile" on public.profiles;
drop policy if exists "officers+ update any profile" on public.profiles;
create policy "officers+ update any profile"
  on public.profiles for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));
