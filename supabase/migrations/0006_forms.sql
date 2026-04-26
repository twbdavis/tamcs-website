-- 0006_forms.sql
-- Native form builder: forms, fields, responses, response values.
--
-- Permission model:
--   - forms / form_fields  : officer+ may CRUD; everyone may SELECT a
--                            published form; officers see drafts too.
--   - form_responses       : authenticated users may INSERT a response for a
--                            published form, owning their own row. Officers+
--                            see all responses; respondents see their own.
--   - form_response_values : same idea, scoped via the parent response.
--
-- Safe to re-run.

-- ─── forms ─────────────────────────────────────────────────────────────────
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists forms_touch_updated_at on public.forms;
create trigger forms_touch_updated_at
  before update on public.forms
  for each row execute function public.touch_updated_at();

alter table public.forms enable row level security;

drop policy if exists "forms public read published" on public.forms;
create policy "forms public read published"
  on public.forms for select
  using (is_published = true);

drop policy if exists "forms officer+ read all" on public.forms;
create policy "forms officer+ read all"
  on public.forms for select
  using (public.has_role_at_least('officer'));

drop policy if exists "forms officer+ insert" on public.forms;
create policy "forms officer+ insert"
  on public.forms for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "forms officer+ update" on public.forms;
create policy "forms officer+ update"
  on public.forms for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "forms officer+ delete" on public.forms;
create policy "forms officer+ delete"
  on public.forms for delete
  using (public.has_role_at_least('officer'));

-- ─── form_fields ───────────────────────────────────────────────────────────
create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  field_type text not null check (field_type in (
    'text','textarea','select','radio','checkbox','number','email'
  )),
  label text not null,
  placeholder text,
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists form_fields_form_order_idx
  on public.form_fields (form_id, display_order);

drop trigger if exists form_fields_touch_updated_at on public.form_fields;
create trigger form_fields_touch_updated_at
  before update on public.form_fields
  for each row execute function public.touch_updated_at();

alter table public.form_fields enable row level security;

-- Anyone who can see the parent form can see its fields.
drop policy if exists "form_fields read with form" on public.form_fields;
create policy "form_fields read with form"
  on public.form_fields for select
  using (
    exists (
      select 1 from public.forms f
      where f.id = form_fields.form_id
        and (f.is_published = true or public.has_role_at_least('officer'))
    )
  );

drop policy if exists "form_fields officer+ insert" on public.form_fields;
create policy "form_fields officer+ insert"
  on public.form_fields for insert
  with check (public.has_role_at_least('officer'));

drop policy if exists "form_fields officer+ update" on public.form_fields;
create policy "form_fields officer+ update"
  on public.form_fields for update
  using (public.has_role_at_least('officer'))
  with check (public.has_role_at_least('officer'));

drop policy if exists "form_fields officer+ delete" on public.form_fields;
create policy "form_fields officer+ delete"
  on public.form_fields for delete
  using (public.has_role_at_least('officer'));

-- ─── form_responses ────────────────────────────────────────────────────────
create table if not exists public.form_responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  respondent_id uuid not null references public.profiles(id) on delete cascade,
  submitted_at timestamptz not null default now()
);

create index if not exists form_responses_form_idx
  on public.form_responses (form_id);
create index if not exists form_responses_respondent_idx
  on public.form_responses (respondent_id);

alter table public.form_responses enable row level security;

drop policy if exists "form_responses officer+ read" on public.form_responses;
create policy "form_responses officer+ read"
  on public.form_responses for select
  using (public.has_role_at_least('officer'));

drop policy if exists "form_responses self read" on public.form_responses;
create policy "form_responses self read"
  on public.form_responses for select
  using (respondent_id = auth.uid());

-- Authenticated users may submit a response, but only for themselves and
-- only against a published form.
drop policy if exists "form_responses self insert" on public.form_responses;
create policy "form_responses self insert"
  on public.form_responses for insert
  with check (
    auth.uid() is not null
    and respondent_id = auth.uid()
    and exists (
      select 1 from public.forms f
      where f.id = form_responses.form_id and f.is_published = true
    )
  );

drop policy if exists "form_responses officer+ delete" on public.form_responses;
create policy "form_responses officer+ delete"
  on public.form_responses for delete
  using (public.has_role_at_least('officer'));

-- ─── form_response_values ──────────────────────────────────────────────────
create table if not exists public.form_response_values (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.form_responses(id) on delete cascade,
  field_id uuid not null references public.form_fields(id) on delete cascade,
  value text
);

create index if not exists form_response_values_response_idx
  on public.form_response_values (response_id);

alter table public.form_response_values enable row level security;

drop policy if exists "form_response_values read with response" on public.form_response_values;
create policy "form_response_values read with response"
  on public.form_response_values for select
  using (
    exists (
      select 1 from public.form_responses r
      where r.id = form_response_values.response_id
        and (r.respondent_id = auth.uid() or public.has_role_at_least('officer'))
    )
  );

drop policy if exists "form_response_values insert with response" on public.form_response_values;
create policy "form_response_values insert with response"
  on public.form_response_values for insert
  with check (
    exists (
      select 1 from public.form_responses r
      where r.id = form_response_values.response_id
        and r.respondent_id = auth.uid()
    )
  );

drop policy if exists "form_response_values officer+ delete" on public.form_response_values;
create policy "form_response_values officer+ delete"
  on public.form_response_values for delete
  using (public.has_role_at_least('officer'));
