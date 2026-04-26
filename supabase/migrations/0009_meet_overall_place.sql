-- 0009_meet_overall_place.sql
-- Adds overall_place (the team's finishing position at a meet) to
-- meet_results. Per-swimmer entries inside the results JSONB no longer
-- carry a place — that label only makes sense at the meet level.
--
-- Safe to re-run.

alter table public.meet_results
  add column if not exists overall_place int
    check (overall_place is null or overall_place >= 1);
