-- Run once in the Supabase SQL editor if you applied schema.sql before uploads
-- were wired up. Safe to re-run.
alter table public.profiles
  add column if not exists avatar_public_id text;

alter table public.pieces
  add column if not exists media_public_id text,
  add column if not exists cover_public_id text,
  add column if not exists gallery_public_ids text[] not null default '{}';
