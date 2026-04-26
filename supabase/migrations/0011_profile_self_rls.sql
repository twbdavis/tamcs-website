-- 0011_profile_self_rls.sql
-- Onboarding upserts the athlete's own profile row. Postgres evaluates the
-- INSERT side of an upsert even when the conflict resolves to UPDATE, so we
-- need an explicit "insert own profile" policy or the whole statement is
-- rejected with: new row violates row-level security policy for table
-- "profiles".
--
-- The UPDATE-own policy already exists (from 0001), but we re-issue it here
-- so this migration also acts as a safety net if it was dropped along the
-- way. Both policies cover every column on the row, including the
-- onboarding fields added in 0010 (first_name, last_name, birthday,
-- class_year, uin, constitution_agreed, onboarding_completed).
--
-- The role-change guard trigger still prevents users from elevating their
-- own role through these policies.
--
-- Safe to re-run.

-- ─── self-insert (covers upsert of a missing profile row) ───────────────────
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ─── self-update (re-affirm 0001's policy; row-level => all columns) ────────
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
