-- 0024_logan_arnold_senior.sql
-- Bumps Logan Arnold's officer-page class year to Senior. Idempotent —
-- updates by email so re-runs are safe.

update public.officers
set year = 'Senior'
where email = 'lmarnold@tamu.edu';
