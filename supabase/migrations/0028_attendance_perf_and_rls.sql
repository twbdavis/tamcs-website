-- 0028_attendance_perf_and_rls.sql
-- Two things in one pass:
--
-- 1) Reaffirm RLS so deployed environments definitely have the right
--    policies (officers see everything; athletes see all sessions and
--    only their own records).
--
-- 2) Add server-side aggregation RPCs so the officer page can render
--    without pulling every record to the browser:
--      - attendance_session_summaries  : paged list of sessions + count
--      - attendance_period_summary     : top-line stats for the filter
--      - attendance_athlete_totals     : per-athlete totals + ranks
--      - attendance_my_records         : an athlete's own records,
--                                        already joined to session info
--
-- Safe to re-run.

-- ─── reaffirm RLS ──────────────────────────────────────────────────────────
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records  enable row level security;

drop policy if exists "attendance_sessions read authed" on public.attendance_sessions;
create policy "attendance_sessions read authed"
  on public.attendance_sessions for select
  to authenticated
  using (true);

drop policy if exists "attendance_sessions officer+ insert" on public.attendance_sessions;
create policy "attendance_sessions officer+ insert"
  on public.attendance_sessions for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "attendance_sessions officer+ update" on public.attendance_sessions;
create policy "attendance_sessions officer+ update"
  on public.attendance_sessions for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "attendance_sessions officer+ delete" on public.attendance_sessions;
create policy "attendance_sessions officer+ delete"
  on public.attendance_sessions for delete
  using (public.has_role_at_least('officer'));

drop policy if exists "attendance_records officer+ read all" on public.attendance_records;
create policy "attendance_records officer+ read all"
  on public.attendance_records for select
  using (public.has_role_at_least('officer'));

drop policy if exists "attendance_records read own" on public.attendance_records;
create policy "attendance_records read own"
  on public.attendance_records for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          (p.uin is not null
            and attendance_records.uin_last4 is not null
            and attendance_records.uin_last4 = right(p.uin, 4))
          or (
            p.full_name is not null
            and lower(attendance_records.athlete_name) = lower(p.full_name)
          )
          or (
            p.first_name is not null and p.last_name is not null
            and lower(attendance_records.athlete_name) =
                lower(p.first_name || ' ' || p.last_name)
          )
          or (
            p.first_name is not null and p.last_name is not null
            and lower(regexp_replace(attendance_records.athlete_name, '\s+', '', 'g'))
              = lower(p.first_name || p.last_name)
          )
          or (
            p.full_name is not null
            and lower(regexp_replace(attendance_records.athlete_name, '\s+', '', 'g'))
              = lower(regexp_replace(p.full_name, '\s+', '', 'g'))
          )
        )
    )
  );

drop policy if exists "attendance_records officer+ insert" on public.attendance_records;
create policy "attendance_records officer+ insert"
  on public.attendance_records for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "attendance_records officer+ update" on public.attendance_records;
create policy "attendance_records officer+ update"
  on public.attendance_records for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "attendance_records officer+ delete" on public.attendance_records;
create policy "attendance_records officer+ delete"
  on public.attendance_records for delete
  using (public.has_role_at_least('officer'));

-- ─── officer-side RPCs ─────────────────────────────────────────────────────
-- Each RPC is SECURITY DEFINER but enforces officer+ internally so the
-- caller never sees data they shouldn't.

create or replace function public.attendance_session_summaries(
  p_semester text default null,
  p_year     text default null,
  p_limit    int  default 20,
  p_offset   int  default 0
)
returns table (
  id                uuid,
  session_date      date,
  title             text,
  semester          text,
  academic_year     text,
  created_by        uuid,
  created_at        timestamptz,
  participant_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    s.id, s.session_date, s.title, s.semester, s.academic_year,
    s.created_by, s.created_at,
    coalesce(c.cnt, 0) as participant_count
  from public.attendance_sessions s
  left join lateral (
    select count(*)::bigint as cnt
    from public.attendance_records r
    where r.session_id = s.id
  ) c on true
  where public.has_role_at_least('officer')
    and (p_semester is null or s.semester = p_semester)
    and (p_year is null or s.academic_year = p_year)
  order by s.session_date desc, s.created_at desc
  limit greatest(coalesce(p_limit, 20), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.attendance_session_summaries(text, text, int, int)
  to authenticated;

create or replace function public.attendance_period_summary(
  p_semester text default null,
  p_year     text default null
)
returns table (
  session_count    bigint,
  total_records    bigint,
  unique_athletes  bigint
)
language sql
security definer
set search_path = public
as $$
  with scoped_sessions as (
    select s.id
    from public.attendance_sessions s
    where public.has_role_at_least('officer')
      and (p_semester is null or s.semester = p_semester)
      and (p_year is null or s.academic_year = p_year)
  ),
  scoped_records as (
    select r.athlete_name, r.uin_last4
    from public.attendance_records r
    join scoped_sessions ss on ss.id = r.session_id
  )
  select
    (select count(*)::bigint from scoped_sessions),
    (select count(*)::bigint from scoped_records),
    (select count(distinct (lower(athlete_name), coalesce(uin_last4, '')))::bigint
       from scoped_records);
$$;

grant execute on function public.attendance_period_summary(text, text)
  to authenticated;

create or replace function public.attendance_athlete_totals(
  p_semester text default null,
  p_year     text default null
)
returns table (
  athlete_name     text,
  uin_last4        text,
  attendance_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    r.athlete_name,
    r.uin_last4,
    count(*)::bigint as attendance_count
  from public.attendance_records r
  join public.attendance_sessions s on s.id = r.session_id
  where public.has_role_at_least('officer')
    and (p_semester is null or s.semester = p_semester)
    and (p_year is null or s.academic_year = p_year)
  group by r.athlete_name, r.uin_last4
  order by count(*) desc, lower(r.athlete_name) asc;
$$;

grant execute on function public.attendance_athlete_totals(text, text)
  to authenticated;

-- ─── athlete-side RPC ──────────────────────────────────────────────────────
-- The same matching logic used in the read-own RLS policy, but as a
-- single SQL join so the athlete page makes one request and gets back
-- only their records joined to session metadata.

create or replace function public.attendance_my_records(
  p_semester text default null,
  p_year     text default null
)
returns table (
  record_id     uuid,
  session_id    uuid,
  session_date  date,
  title         text,
  semester      text,
  academic_year text,
  is_restricted boolean
)
language sql
security definer
set search_path = public
as $$
  select
    r.id, s.id, s.session_date, s.title, s.semester, s.academic_year,
    r.is_restricted
  from public.attendance_records r
  join public.attendance_sessions s on s.id = r.session_id
  join public.profiles p on p.id = auth.uid()
  where (p_semester is null or s.semester = p_semester)
    and (p_year is null or s.academic_year = p_year)
    and (
      (p.uin is not null
        and r.uin_last4 is not null
        and r.uin_last4 = right(p.uin, 4))
      or (
        p.full_name is not null
        and lower(r.athlete_name) = lower(p.full_name)
      )
      or (
        p.first_name is not null and p.last_name is not null
        and lower(r.athlete_name) =
            lower(p.first_name || ' ' || p.last_name)
      )
      or (
        p.first_name is not null and p.last_name is not null
        and lower(regexp_replace(r.athlete_name, '\s+', '', 'g'))
          = lower(p.first_name || p.last_name)
      )
      or (
        p.full_name is not null
        and lower(regexp_replace(r.athlete_name, '\s+', '', 'g'))
          = lower(regexp_replace(p.full_name, '\s+', '', 'g'))
      )
    )
  order by s.session_date desc;
$$;

grant execute on function public.attendance_my_records(text, text)
  to authenticated;

-- Indexes that help the new aggregations.
create index if not exists attendance_records_session_idx_v2
  on public.attendance_records (session_id);
create index if not exists attendance_records_athlete_uin_idx
  on public.attendance_records (lower(athlete_name), uin_last4);
