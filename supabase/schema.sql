-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Safe to run again; it only creates what is missing.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null check (char_length(description) between 1 and 120),
  category text not null,
  amount numeric(14, 2) not null check (amount > 0),
  paid_by text not null default '' check (char_length(paid_by) <= 60),
  status text not null check (status in ('paid', 'pending')),
  created_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses (date desc);

-- Small key/value settings, e.g. the total budget.
create table if not exists public.settings (
  key text primary key,
  value text not null
);

-- Wrong-password counter used to lock out guessing (5 tries, then 15 minutes).
create table if not exists public.login_attempts (
  ip text primary key,
  attempts integer not null default 0,
  window_start timestamptz not null default now()
);

-- Lock these tables down. Row Level Security with NO policies means the public
-- (anon / authenticated) keys cannot read or write anything here. Only the
-- server, using the secret key, can.
alter table public.expenses enable row level security;
alter table public.settings enable row level security;
alter table public.login_attempts enable row level security;

revoke all on public.expenses, public.settings, public.login_attempts
  from anon, authenticated;
