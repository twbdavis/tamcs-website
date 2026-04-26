-- 0012_backfill_meet_overall_place.sql
-- One-time backfill: any meet that pre-dates the overall_place column
-- (added in 0009) is hardcoded to 1st place. Future meets get their own
-- value via the admin meet-results form, so this migration only touches
-- rows where overall_place is currently NULL.
--
-- Safe to re-run.

update public.meet_results
set overall_place = 1
where overall_place is null;
