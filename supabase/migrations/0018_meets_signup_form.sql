-- 0018_meets_signup_form.sql
-- Lets a meet link an internal team form (built in /admin/forms) as its
-- signup, instead of pasting an external URL. Either column may be set;
-- the UI prefers signup_form_id when both are present.
--
-- Safe to re-run.

alter table public.meets
  add column if not exists signup_form_id uuid
    references public.forms(id) on delete set null;

create index if not exists meets_signup_form_idx
  on public.meets (signup_form_id)
  where signup_form_id is not null;
