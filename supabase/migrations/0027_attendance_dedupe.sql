-- 0027_attendance_dedupe.sql
-- One-shot cleanup: when two or more attendance_sessions share the same
-- session_date AND the same exact roster (same set of athletes by name +
-- uin_last4), keep the oldest one and drop the others. attendance_records
-- cascade away with their parent session via the existing FK.
--
-- Roster equality is computed from a deterministic fingerprint:
-- sort each (lower(name), uin_last4) pair, concatenate, and compare.
--
-- Safe to re-run — once the duplicates are gone, the DELETE matches
-- nothing on subsequent runs.

with rosters as (
  select
    s.id,
    s.session_date,
    s.created_at,
    coalesce(
      (
        select string_agg(
          lower(r.athlete_name) || '|' || coalesce(r.uin_last4, ''),
          ','
          order by lower(r.athlete_name), coalesce(r.uin_last4, '')
        )
        from public.attendance_records r
        where r.session_id = s.id
      ),
      ''
    ) as fingerprint
  from public.attendance_sessions s
),
ranked as (
  select
    id,
    row_number() over (
      partition by session_date, fingerprint
      order by created_at asc, id asc
    ) as rn
  from rosters
)
delete from public.attendance_sessions
where id in (select id from ranked where rn > 1);
