-- 0014_workout_sets.sql
-- Coach-authored workout sets, reviewed by officers/admin/president before
-- they enter a shared bank that all coach+ users can browse.
--
-- Permission model:
--   workout_sets
--     INSERT  : coach role only (and created_by must be self)
--     UPDATE  : coach owner (any field) OR officer+ (status / comment)
--     DELETE  : coach owner only
--     SELECT  : own row (any status) OR approved (coach+) OR officer+ (all)
--
--   workout_sections
--     Same scopes as the parent set, enforced via subquery.
--
-- Safe to re-run.

-- ─── workout_sets ───────────────────────────────────────────────────────────
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_sets_status_idx
  on public.workout_sets (status);
create index if not exists workout_sets_created_by_idx
  on public.workout_sets (created_by);
create index if not exists workout_sets_status_created_idx
  on public.workout_sets (status, created_at desc);

drop trigger if exists workout_sets_touch_updated_at on public.workout_sets;
create trigger workout_sets_touch_updated_at
  before update on public.workout_sets
  for each row execute function public.touch_updated_at();

alter table public.workout_sets enable row level security;

drop policy if exists "workout_sets select own" on public.workout_sets;
create policy "workout_sets select own"
  on public.workout_sets for select
  using (created_by = auth.uid());

drop policy if exists "workout_sets select approved coach+" on public.workout_sets;
create policy "workout_sets select approved coach+"
  on public.workout_sets for select
  using (status = 'approved' and public.has_role_at_least('coach'));

drop policy if exists "workout_sets select all officer+" on public.workout_sets;
create policy "workout_sets select all officer+"
  on public.workout_sets for select
  using (public.has_role_at_least('officer'));

drop policy if exists "workout_sets insert coach own" on public.workout_sets;
create policy "workout_sets insert coach own"
  on public.workout_sets for insert
  with check (
    public.current_user_role() = 'coach' and created_by = auth.uid()
  );

drop policy if exists "workout_sets update coach own" on public.workout_sets;
create policy "workout_sets update coach own"
  on public.workout_sets for update
  using (
    public.current_user_role() = 'coach' and created_by = auth.uid()
  )
  with check (
    public.current_user_role() = 'coach' and created_by = auth.uid()
  );

drop policy if exists "workout_sets update officer+" on public.workout_sets;
create policy "workout_sets update officer+"
  on public.workout_sets for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "workout_sets delete coach own" on public.workout_sets;
create policy "workout_sets delete coach own"
  on public.workout_sets for delete
  using (
    public.current_user_role() = 'coach' and created_by = auth.uid()
  );

-- ─── workout_sections ───────────────────────────────────────────────────────
create table if not exists public.workout_sections (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.workout_sets(id) on delete cascade,
  section_type text not null check (section_type in (
    'warmup', 'preset', 'kick', 'pull', 'main', 'sprint'
  )),
  display_order int not null default 0,
  content text not null default '',
  total_yardage int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_sections_set_order_idx
  on public.workout_sections (set_id, display_order);

drop trigger if exists workout_sections_touch_updated_at on public.workout_sections;
create trigger workout_sections_touch_updated_at
  before update on public.workout_sections
  for each row execute function public.touch_updated_at();

alter table public.workout_sections enable row level security;

-- Visibility on a section follows visibility on its parent set.
drop policy if exists "workout_sections select via parent" on public.workout_sections;
create policy "workout_sections select via parent"
  on public.workout_sections for select
  using (
    exists (
      select 1 from public.workout_sets s
      where s.id = workout_sections.set_id
        and (
          s.created_by = auth.uid()
          or (s.status = 'approved' and public.has_role_at_least('coach'))
          or public.has_role_at_least('officer')
        )
    )
  );

-- Writes only by the coach owner of the parent set.
drop policy if exists "workout_sections write coach owner" on public.workout_sections;
create policy "workout_sections write coach owner"
  on public.workout_sections for all
  using (
    exists (
      select 1 from public.workout_sets s
      where s.id = workout_sections.set_id
        and s.created_by = auth.uid()
        and public.current_user_role() = 'coach'
    )
  )
  with check (
    exists (
      select 1 from public.workout_sets s
      where s.id = workout_sections.set_id
        and s.created_by = auth.uid()
        and public.current_user_role() = 'coach'
    )
  );
