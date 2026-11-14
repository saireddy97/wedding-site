-- Pre-wedding page tables. Run in Supabase: SQL Editor > New query > paste > Run.
-- Safe to run again; it only adds what is missing.

-- Invited guests. The phone number (10 digits) is the key; name is filled in
-- the first time the guest signs in.
create table if not exists public.prelude_guests (
  phone text primary key check (phone ~ '^[0-9]{10}$'),
  name text check (char_length(name) <= 60),
  created_at timestamptz not null default now()
);

-- Events. audience = 'everyone' (main events, shown to all) or 'guests'
-- (pre-wedding events, shown only to guests on the list after sign-in).
create table if not exists public.prelude_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  event_date date,
  event_time text not null default '' check (char_length(event_time) <= 40),
  venue text not null default '' check (char_length(venue) <= 120),
  details text not null default '' check (char_length(details) <= 500),
  audience text not null check (audience in ('everyone', 'guests')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Only the server (secret key) can read or write these tables.
alter table public.prelude_guests enable row level security;
alter table public.prelude_events enable row level security;
revoke all on public.prelude_guests, public.prelude_events from anon, authenticated;

-- The three main events, added once. Dates and venues can be filled in from the admin page.
insert into public.prelude_events (title, audience, sort_order)
select v.title, 'everyone', v.sort_order
from (values ('Pellikuturu', 1), ('Pellikoduku', 2), ('Marriage', 3)) as v(title, sort_order)
where not exists (select 1 from public.prelude_events e where e.title = v.title);
