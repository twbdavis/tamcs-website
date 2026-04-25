-- 0002_content_tables.sql
-- Adds officers, team_records, schedule, meet_results, blog_posts tables.
-- All tables: public read; insert/update/delete restricted to officers/admins.
--
-- Safe to re-run.

-- ─── shared updated_at trigger fn (reused for every table) ───────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── officers ───────────────────────────────────────────────────────────────
create table if not exists public.officers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  email text,
  year text,
  photo_url text,
  bio text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists officers_touch_updated_at on public.officers;
create trigger officers_touch_updated_at
  before update on public.officers
  for each row execute function public.touch_updated_at();

alter table public.officers enable row level security;

drop policy if exists "officers public read" on public.officers;
create policy "officers public read"
  on public.officers for select
  using (true);

drop policy if exists "officers insert by officers/admins" on public.officers;
create policy "officers insert by officers/admins"
  on public.officers for insert
  with check (public.is_officer_or_admin());

drop policy if exists "officers update by officers/admins" on public.officers;
create policy "officers update by officers/admins"
  on public.officers for update
  using (public.is_officer_or_admin())
  with check (public.is_officer_or_admin());

drop policy if exists "officers delete by officers/admins" on public.officers;
create policy "officers delete by officers/admins"
  on public.officers for delete
  using (public.is_officer_or_admin());

-- ─── team_records ───────────────────────────────────────────────────────────
do $$
begin
  create type public.record_category as enum ('men', 'women', 'mixed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.team_records (
  id uuid primary key default gen_random_uuid(),
  swimmer_name text not null,
  event text not null,
  time text not null,
  year text,
  category public.record_category not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists team_records_touch_updated_at on public.team_records;
create trigger team_records_touch_updated_at
  before update on public.team_records
  for each row execute function public.touch_updated_at();

alter table public.team_records enable row level security;

drop policy if exists "team_records public read" on public.team_records;
create policy "team_records public read"
  on public.team_records for select using (true);

drop policy if exists "team_records insert by officers/admins" on public.team_records;
create policy "team_records insert by officers/admins"
  on public.team_records for insert
  with check (public.is_officer_or_admin());

drop policy if exists "team_records update by officers/admins" on public.team_records;
create policy "team_records update by officers/admins"
  on public.team_records for update
  using (public.is_officer_or_admin())
  with check (public.is_officer_or_admin());

drop policy if exists "team_records delete by officers/admins" on public.team_records;
create policy "team_records delete by officers/admins"
  on public.team_records for delete
  using (public.is_officer_or_admin());

-- ─── schedule ──────────────────────────────────────────────────────────────
do $$
begin
  create type public.schedule_type as enum ('practice', 'meet', 'social', 'other');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null,
  title text not null,
  location text,
  type public.schedule_type not null default 'other',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists schedule_touch_updated_at on public.schedule_events;
create trigger schedule_touch_updated_at
  before update on public.schedule_events
  for each row execute function public.touch_updated_at();

alter table public.schedule_events enable row level security;

drop policy if exists "schedule public read" on public.schedule_events;
create policy "schedule public read"
  on public.schedule_events for select using (true);

drop policy if exists "schedule insert by officers/admins" on public.schedule_events;
create policy "schedule insert by officers/admins"
  on public.schedule_events for insert
  with check (public.is_officer_or_admin());

drop policy if exists "schedule update by officers/admins" on public.schedule_events;
create policy "schedule update by officers/admins"
  on public.schedule_events for update
  using (public.is_officer_or_admin())
  with check (public.is_officer_or_admin());

drop policy if exists "schedule delete by officers/admins" on public.schedule_events;
create policy "schedule delete by officers/admins"
  on public.schedule_events for delete
  using (public.is_officer_or_admin());

-- ─── meet_results ──────────────────────────────────────────────────────────
create table if not exists public.meet_results (
  id uuid primary key default gen_random_uuid(),
  meet_name text not null,
  date date not null,
  location text,
  results jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists meet_results_touch_updated_at on public.meet_results;
create trigger meet_results_touch_updated_at
  before update on public.meet_results
  for each row execute function public.touch_updated_at();

alter table public.meet_results enable row level security;

drop policy if exists "meet_results public read" on public.meet_results;
create policy "meet_results public read"
  on public.meet_results for select using (true);

drop policy if exists "meet_results insert by officers/admins" on public.meet_results;
create policy "meet_results insert by officers/admins"
  on public.meet_results for insert
  with check (public.is_officer_or_admin());

drop policy if exists "meet_results update by officers/admins" on public.meet_results;
create policy "meet_results update by officers/admins"
  on public.meet_results for update
  using (public.is_officer_or_admin())
  with check (public.is_officer_or_admin());

drop policy if exists "meet_results delete by officers/admins" on public.meet_results;
create policy "meet_results delete by officers/admins"
  on public.meet_results for delete
  using (public.is_officer_or_admin());

-- ─── blog_posts ────────────────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null default '',
  author text,
  published_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists blog_posts_touch_updated_at on public.blog_posts;
create trigger blog_posts_touch_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_updated_at();

alter table public.blog_posts enable row level security;

-- Public can only read published posts; officers/admins read all (separate policies OR'd).
drop policy if exists "blog_posts public read published" on public.blog_posts;
create policy "blog_posts public read published"
  on public.blog_posts for select
  using (is_published = true);

drop policy if exists "blog_posts officers read all" on public.blog_posts;
create policy "blog_posts officers read all"
  on public.blog_posts for select
  using (public.is_officer_or_admin());

drop policy if exists "blog_posts insert by officers/admins" on public.blog_posts;
create policy "blog_posts insert by officers/admins"
  on public.blog_posts for insert
  with check (public.is_officer_or_admin());

drop policy if exists "blog_posts update by officers/admins" on public.blog_posts;
create policy "blog_posts update by officers/admins"
  on public.blog_posts for update
  using (public.is_officer_or_admin())
  with check (public.is_officer_or_admin());

drop policy if exists "blog_posts delete by officers/admins" on public.blog_posts;
create policy "blog_posts delete by officers/admins"
  on public.blog_posts for delete
  using (public.is_officer_or_admin());

-- ─── seed: officers ────────────────────────────────────────────────────────
-- Idempotent seed via deterministic UUIDs (md5 of email).
insert into public.officers (id, name, role, email, year, bio, display_order)
values
  (
    md5('twbdavis@tamu.edu')::uuid,
    'Thomas Davis', 'President', 'twbdavis@tamu.edu', 'Senior',
    'Howdy! My name is Thomas Davis, and I am a senior Management Information Systems major from Cypress, Texas. My favorite event is the 200 butterfly (pain). I am incredibly excited for this year of club swimming, it''s going to be awesome. Gig''em!',
    1
  ),
  (
    md5('lmarnold@tamu.edu')::uuid,
    'Logan Arnold', 'Vice President', 'lmarnold@tamu.edu', 'Junior',
    'Howdy! My name is Logan Arnold and I''m a junior Mechanical Engineering major from Katy, Texas. A fun fact about me is I broke my pelvis playing kickball and I have a 300 fly time on meet mobile. I will be serving as TAMUCS meet coordinator this year, and I can''t wait for this upcoming season to start! Gig''em!',
    2
  ),
  (
    md5('clairehegar@tamu.edu')::uuid,
    'Claire Hegar', 'Secretary', 'clairehegar@tamu.edu', 'Junior',
    'Howdy! My name is Claire Hegar and I am a junior Industrial Engineering major from Katy, Texas! My favorite events are everything backstroke and 50 free! My favorite team memory making a comeback to swim after a bad knee injury. Not only making it back to nationals, but seeing how excited and supportive everyone was for me after coming back! Gig''em!',
    3
  ),
  (
    md5('laurenrob39@tamu.edu')::uuid,
    'Lauren Roberts', 'Treasurer', 'laurenrob39@tamu.edu', 'Sophomore',
    'Howdy! My name is Lauren and I''m a sophomore Meteorology major from Cedar Park, Texas. My favorite events are the 50 and 100 breast! My favorite team memory is the ice-skating social we do every Spring. Gig''em!',
    4
  ),
  (
    md5('lorelaiswims@tamu.edu')::uuid,
    'Lorelai Walker', 'Marketing Director', 'lorelaiswims@tamu.edu', 'Junior',
    'Howdy! My name is Lorelai Walker! I am a junior Journalism major, class of 2026! My favorite events are the 200 fly and free. My favorite club swim memory was traveling to Nationals with the team and all of the amazing experiences that came with it! Gig''em!',
    5
  ),
  (
    md5('granttdionne06@tamu.edu')::uuid,
    'Grant Dionne', 'Captain', 'granttdionne06@tamu.edu', 'Sophomore',
    'Howdy! My name is Grant Dionne and I''m a sophomore Kinesiology major from Houston, Texas and I''m the loudest and proudest member of the fighting Texas Aggie class of 2028 ay ay ay ay! My favorite club memory on the team is racing in the relays at nationals and cheering everyone on. Gig''em!',
    6
  ),
  (
    md5('reneenavarro@tamu.edu')::uuid,
    'Renee Navarro', 'Meet Coordinator', 'reneenavarro@tamu.edu', 'Sophomore',
    'Howdy! My name is Renee and I am a sophomore Human Resource Development major from Houston, Texas! My favorite events are sprint free and IM. My favorite team memory is getting Andy''s nights after practice! Gig''em!',
    7
  ),
  (
    md5('cishade@tamu.edu')::uuid,
    'Caroline Shade', 'Special Events Coordinator', 'cishade@tamu.edu', 'Sophomore',
    'Hi my name is Caroline Shade! I am a sophomore Kinesiology major and I will be serving as this year''s Special Events Coordinator! My fav/best events are the 100 free and 100 IM! My favorite club swim memory was the 2024 fall banquet and all the fun social activities we did throughout the year such as ice skating! Gig''em!',
    8
  )
on conflict (id) do nothing;

-- ─── seed: team_records (women) ────────────────────────────────────────────
insert into public.team_records (id, event, swimmer_name, year, time, category, display_order)
values
  (md5('w-50-free')::uuid,        '50 Free',          'Emily Henson',                                '2018', '24.51',     'women', 1),
  (md5('w-100-free')::uuid,       '100 Free',         'Emily Henson',                                '2018', '52.90',     'women', 2),
  (md5('w-200-free')::uuid,       '200 Free',         'Hannah Marcus',                               '2022', '2:00.36',   'women', 3),
  (md5('w-500-free')::uuid,       '500 Free',         'Hannah Hooper',                               '2022', '5:24.54',   'women', 4),
  (md5('w-1000-free')::uuid,      '1000 Free',        'Sarah Anderson',                              '2023', '14:28.57',  'women', 5),
  (md5('w-50-back')::uuid,        '50 Back',          'Diana Kolb',                                  '2025', '26.94',     'women', 6),
  (md5('w-100-back')::uuid,       '100 Back',         'Diana Kolb',                                  '2025', '58.45',     'women', 7),
  (md5('w-200-back')::uuid,       '200 Back',         'Kelli Currington',                            '2022', '2:23.83',   'women', 8),
  (md5('w-50-breast')::uuid,      '50 Breast',        'Hannah Hooper',                               '2022', '31.05',     'women', 9),
  (md5('w-100-breast')::uuid,     '100 Breast',       'Jarrah Schlosberg',                           '2019', '1:09.27',   'women', 10),
  (md5('w-200-breast')::uuid,     '200 Breast',       'Presley Jiang',                               '2025', '2:35.10',   'women', 11),
  (md5('w-50-fly')::uuid,         '50 Fly',           'Olivia Haskell',                              '2022', '26.49',     'women', 12),
  (md5('w-100-fly')::uuid,        '100 Fly',          'Olivia Haskell',                              '2022', '58.19',     'women', 13),
  (md5('w-200-fly')::uuid,        '200 Fly',          'Hannah Marcus',                               '2023', '2:18.23',   'women', 14),
  (md5('w-100-im')::uuid,         '100 IM',           'Jarrah Schlosberg',                           '2019', '1:02.01',   'women', 15),
  (md5('w-200-im')::uuid,         '200 IM',           'Ali Basel',                                   '2022', '2:16.72',   'women', 16),
  (md5('w-400-im')::uuid,         '400 IM',           'Lorelai Walker',                              '2024', '5:00.93',   'women', 17),
  (md5('w-200-free-relay')::uuid, '200 Free Relay',   'Currington, Rendel, Basel, Haskell',          '2022', '1:44.44',   'women', 18),
  (md5('w-400-free-relay')::uuid, '400 Free Relay',   'Basel, Currington, Hooper, Haskell',          '2022', '3:45.06',   'women', 19),
  (md5('w-800-free-relay')::uuid, '800 Free Relay',   'Currington, Newton, Basel, Hooper',           '2022', '8:21.55',   'women', 20),
  (md5('w-200-medley-relay')::uuid,'200 Medley Relay','Currington, Hooper, Haskell, Marcus',         '2022', '1:53.75',   'women', 21),
  (md5('w-400-medley-relay')::uuid,'400 Medley Relay','Currington, Hooper, Haskell, Newton',         '2022', '4:15.01',   'women', 22)
on conflict (id) do nothing;

-- ─── seed: team_records (men) ──────────────────────────────────────────────
insert into public.team_records (id, event, swimmer_name, year, time, category, display_order)
values
  (md5('m-50-free')::uuid,        '50 Free',          'Nolan Persyn',                                '2019', '20.87',     'men', 1),
  (md5('m-100-free')::uuid,       '100 Free',         'Efrain Soto',                                 '2025', '46.28',     'men', 2),
  (md5('m-200-free')::uuid,       '200 Free',         'Alexander Riedel',                            '2024', '1:41.45',   'men', 3),
  (md5('m-500-free')::uuid,       '500 Free',         'Dylan Michaels',                              '2022', '4:51.01',   'men', 4),
  (md5('m-1000-free')::uuid,      '1000 Free',        'Mason Greenblatt',                            '2022', '9:50.96',   'men', 5),
  (md5('m-50-back')::uuid,        '50 Back',          'Alexander Riedel',                            '2024', '24.01',     'men', 6),
  (md5('m-100-back')::uuid,       '100 Back',         'Efrain Soto',                                 '2025', '52.37',     'men', 7),
  (md5('m-200-back')::uuid,       '200 Back',         'Timothy Guan',                                '2025', '1:59.97',   'men', 8),
  (md5('m-50-breast')::uuid,      '50 Breast',        'William Miranda',                             '2022', '26.46',     'men', 9),
  (md5('m-100-breast')::uuid,     '100 Breast',       'William Miranda',                             '2022', '52.54',     'men', 10),
  (md5('m-200-breast')::uuid,     '200 Breast',       'Derek Wu',                                    '2022', '2:11.00',   'men', 11),
  (md5('m-50-fly')::uuid,         '50 Fly',           'Nolan Persyn',                                '2019', '21.95',     'men', 12),
  (md5('m-100-fly')::uuid,        '100 Fly',          'Nolan Persyn',                                '2019', '48.10',     'men', 13),
  (md5('m-200-fly')::uuid,        '200 Fly',          'Nolan Persyn',                                '2018', '1:49.23',   'men', 14),
  (md5('m-100-im')::uuid,         '100 IM',           'Derek Wu',                                    '2022', '53.22',     'men', 15),
  (md5('m-200-im')::uuid,         '200 IM',           'Isaiah Eichel',                               '2025', '1:54.42',   'men', 16),
  (md5('m-400-im')::uuid,         '400 IM',           'Mason Greenblatt',                            '2019', '4:02.45',   'men', 17),
  (md5('m-200-free-relay')::uuid, '200 Free Relay',   'Wu, Mulloy, Johnson, Bauer',                  '2022', '1:26.49',   'men', 18),
  (md5('m-400-free-relay')::uuid, '400 Free Relay',   'Wu, Mulloy, Johnson, Bauer',                  '2022', '3:12.41',   'men', 19),
  (md5('m-800-free-relay')::uuid, '800 Free Relay',   'Wu, Sung, Mulloy, Michaels',                  '2022', '7:12.59',   'men', 20),
  (md5('m-200-medley-relay')::uuid,'200 Medley Relay','Clark, Wu, Mulloy, Bauer',                    '2022', '1:36.38',   'men', 21),
  (md5('m-400-medley-relay')::uuid,'400 Medley Relay','N. Tann, R. Blanchard, N. Persyn, R. McManus','2018', '3:30.48',   'men', 22)
on conflict (id) do nothing;
