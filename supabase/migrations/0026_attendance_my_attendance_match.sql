-- 0026_attendance_my_attendance_match.sql
-- Loosen the athlete-read policy on attendance_records so the matching
-- catches the realistic name variants that show up in the wild:
--   - Profile "Thomas Davis"      vs. record "Thomas Davis"     (already worked)
--   - Profile "Thomas Davis"      vs. record "ThomasDavis"      (sportclubs concat)
--   - Profile first/last separate vs. record "Thomas Davis"     (no full_name)
--   - Profile UIN ends in "1234"  vs. record uin_last4 = "1234" (already worked)
-- The OR chain keeps each option independent — any one match grants read.
--
-- Safe to re-run.

drop policy if exists "attendance_records read own" on public.attendance_records;
create policy "attendance_records read own"
  on public.attendance_records for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          -- UIN last-4 match (most reliable when both sides have UINs).
          (p.uin is not null
            and attendance_records.uin_last4 is not null
            and attendance_records.uin_last4 = right(p.uin, 4))
          -- Full-name match, case-insensitive.
          or (
            p.full_name is not null
            and lower(attendance_records.athlete_name) = lower(p.full_name)
          )
          -- first_name + " " + last_name, case-insensitive.
          or (
            p.first_name is not null and p.last_name is not null
            and lower(attendance_records.athlete_name) =
                lower(p.first_name || ' ' || p.last_name)
          )
          -- Whitespace-normalized comparison so "ThomasDavis" matches
          -- "Thomas Davis" (sportclubs concatenated paste).
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
