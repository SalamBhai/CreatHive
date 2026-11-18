-- Run in the Supabase SQL editor to support banner uploads. Safe to re-run.
alter table public.profiles
  add column if not exists banner_url text,
  add column if not exists banner_public_id text;
