-- 0017_class_year_rollover.sql
-- Annual class-year rollover. On March 1 each year every athlete is bumped
-- to the next class year:
--   Freshman → Sophomore → Junior → Senior → 5th Year → Graduate (sticks)
--
-- Implemented as two SQL functions:
--   _rollover_class_years_unchecked()  — does the work; no auth check.
--                                        Called by the pg_cron job and by
--                                        the public wrapper.
--   rollover_class_years()             — public RPC entry point. Refuses
--                                        anyone but the president.
--
-- pg_cron schedules the unchecked variant for 06:00 UTC on March 1
-- (midnight CST — DST has not started yet on March 1, so CST always
-- applies on this date).
--
-- Safe to re-run.

-- ─── unchecked rollover (cron + wrapper) ───────────────────────────────────
create or replace function public._rollover_class_years_unchecked()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  update public.profiles
  set class_year = case class_year
    when 'Freshman'  then 'Sophomore'
    when 'Sophomore' then 'Junior'
    when 'Junior'    then 'Senior'
    when 'Senior'    then '5th Year'
    when '5th Year'  then 'Graduate'
    else class_year  -- Graduate stays Graduate; null stays null
  end
  where role = 'athlete'
    and class_year in ('Freshman','Sophomore','Junior','Senior','5th Year');

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public._rollover_class_years_unchecked() from public;

-- ─── public wrapper: president-only RPC ────────────────────────────────────
create or replace function public.rollover_class_years()
returns int
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_president() then
    raise exception 'Only the president can roll over class years';
  end if;
  return public._rollover_class_years_unchecked();
end;
$$;

grant execute on function public.rollover_class_years() to authenticated;

-- ─── pg_cron schedule ──────────────────────────────────────────────────────
-- pg_cron is enabled by default on hosted Supabase. If your environment
-- doesn't have it, comment out this block and rely on the manual button.
create extension if not exists pg_cron;

-- 06:00 UTC = midnight CST. cron.schedule with the same name updates the
-- existing job, so this is safe to re-run.
select cron.schedule(
  'rollover-class-years',
  '0 6 1 3 *',
  $$select public._rollover_class_years_unchecked();$$
);
