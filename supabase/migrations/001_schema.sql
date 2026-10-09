-- Stacks: core schema (see README "Data model")
create extension if not exists btree_gist;
create extension if not exists pg_trgm;

-- Rooms, desks and laptops share one table
create table resources (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('room', 'desk', 'laptop')),
  name       text not null,          -- "Group Room 2.04", "Desk Q-17", "MacBook Air #3"
  floor      int,
  zone       text,                   -- 'silent' | 'quiet' | 'group'
  capacity   int,                    -- rooms only
  features   text[] default '{}',    -- {'whiteboard','screen','power','mac','windows'}
  is_active  boolean default true
);

create table bookings (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id),
  student_id  text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'active' check (status in ('active', 'cancelled')),
  created_at  timestamptz default now(),
  check (ends_at > starts_at),
  -- the database itself refuses double bookings
  exclude using gist (resource_id with =, tstzrange(starts_at, ends_at) with &&)
    where (status = 'active')
);

create table books (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  author           text,
  isbn             text,
  subject          text,
  floor            int,
  shelf            text,             -- e.g. "QA76.76 .M37"
  copies_total     int default 1,
  copies_available int default 1,
  check (copies_available between 0 and copies_total)
);

-- One row per visit. Scanning in opens a visit, scanning the same QR again closes it.
create table library_visits (
  id          uuid primary key default gen_random_uuid(),
  student_id  text not null,
  entered_at  timestamptz not null default now(),
  left_at     timestamptz            -- null = still inside
);
create index on library_visits (entered_at);
-- a student can only have one open visit at a time
create unique index one_open_visit on library_visits (student_id) where left_at is null;

-- Row Level Security: anon can read resources, bookings and books.
-- library_visits has no public policy. All writes go through Edge Functions (service role).
alter table resources      enable row level security;
alter table bookings       enable row level security;
alter table books          enable row level security;
alter table library_visits enable row level security;

create policy "public read" on resources for select to anon using (true);
create policy "public read" on bookings  for select to anon using (true);
create policy "public read" on books     for select to anon using (true);
