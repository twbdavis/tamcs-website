-- 0020_rollover_august_active.sql
-- Move the annual class-year rollover from March 1 to August 1 (start of
-- the academic year) and limit it to approved active accounts. Drops the
-- public RPC wrapper that backed the (now removed) manual dashboard button.
--
-- Safe to re-run.

-- ─── update the unchecked rollover to filter on account_approved ───────────
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
    else class_year  -- Graduate sticks; null stays null
  end
  where role = 'athlete'
    and account_approved = true
    and class_year in ('Freshman','Sophomore','Junior','Senior','5th Year');

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- ─── drop the public wrapper (no manual button anymore) ────────────────────
drop function if exists public.rollover_class_years();

-- ─── reschedule cron to August 1 ───────────────────────────────────────────
-- 05:00 UTC = midnight CDT (DST is in effect on August 1). Re-running
-- cron.schedule with the same job name replaces the previous schedule, so
-- the old March entry is overwritten.
select cron.schedule(
  'rollover-class-years',
  '0 5 1 8 *',
  $$select public._rollover_class_years_unchecked();$$
);
