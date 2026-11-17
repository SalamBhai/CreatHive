-- CreatHive schema + Row Level Security
-- Run in the Supabase SQL editor. Uses the new `publishable` key model:
-- the browser talks to PostgREST with RLS as the only access boundary.

create extension if not exists pgcrypto;

-- Profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  tagline text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  banner_gradient text not null default '',
  disciplines text[] not null default '{}',
  location text not null default '',
  cohort_badge text,
  is_available_for_gigs boolean not null default false,
  social_links jsonb not null default '{}'::jsonb,
  theme_style text not null default 'soft-brutal',
  stats jsonb not null default '{"viewsCount":0,"applauseCount":0,"piecesCount":0}'::jsonb,
  is_ypat_data boolean not null default false,
  source text not null default 'live', -- 'mock' | 'live' | 'campaign'
  created_at timestamptz not null default now()
);

-- Pieces -------------------------------------------------------------------
create table if not exists public.pieces (
  id uuid primary key default gen_random_uuid(),
  creative_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subtitle text,
  discipline text not null,
  media_type text not null,
  media_url text,
  text_content text,
  body_html text,
  pdf_url text,
  cover_image_url text,
  gallery_images text[] not null default '{}',
  is_featured boolean not null default false,
  status text not null default 'PUBLIC', -- PUBLIC | UNLISTED | DRAFT
  sort_order integer not null default 0,
  applause_count integer not null default 0,
  duration text,
  tags text[] not null default '{}',
  source text not null default 'live',
  created_at timestamptz not null default now()
);

create index if not exists pieces_creative_idx on public.pieces(creative_id);
create index if not exists pieces_public_idx on public.pieces(status, created_at desc);

-- Inquiries ----------------------------------------------------------------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  creative_id uuid not null references public.profiles(id) on delete cascade,
  sender_name text not null,
  sender_organization text,
  sender_email text not null,
  sender_phone text,
  event_type text not null,
  message text not null,
  status text not null default 'PENDING', -- PENDING | REVIEWED | RESPONDED
  created_at timestamptz not null default now()
);

create index if not exists inquiries_creative_idx on public.inquiries(creative_id);

-- Join requests (admin only) ------------------------------------------------
create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  display_name text not null,
  email text not null,
  tagline text not null default '',
  status text not null default 'PENDING', -- PENDING | APPROVED
  created_at timestamptz not null default now()
);

-- Applause counter (atomic) -------------------------------------------------
create or replace function public.increment_applause(piece_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.pieces set applause_count = applause_count + 1 where id = piece_id;
$$;

-- RLS ----------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.pieces enable row level security;
alter table public.inquiries enable row level security;
alter table public.join_requests enable row level security;

-- Profiles: anyone can read; a user may update/insert their own row.
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);

drop policy if exists "creatives insert own profile" on public.profiles;
create policy "creatives insert own profile" on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "creatives update own profile" on public.profiles;
create policy "creatives update own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Pieces: public + unlisted readable; drafts private to owner. Writes own only.
drop policy if exists "published pieces are readable" on public.pieces;
create policy "published pieces are readable" on public.pieces for select
  using (status = 'PUBLIC' or status = 'UNLISTED' or creative_id = auth.uid());

drop policy if exists "creatives insert own pieces" on public.pieces;
create policy "creatives insert own pieces" on public.pieces for insert
  with check (creative_id = auth.uid());

drop policy if exists "creatives manage own pieces" on public.pieces;
create policy "creatives manage own pieces" on public.pieces for update
  using (creative_id = auth.uid()) with check (creative_id = auth.uid());

drop policy if exists "creatives delete own pieces" on public.pieces;
create policy "creatives delete own pieces" on public.pieces for delete
  using (creative_id = auth.uid());

-- Inquiries: anyone may submit; only the owning creative may read/update.
drop policy if exists "anyone can send an inquiry" on public.inquiries;
create policy "anyone can send an inquiry" on public.inquiries for insert
  with check (true);

drop policy if exists "creatives read own inquiries" on public.inquiries;
create policy "creatives read own inquiries" on public.inquiries for select
  using (creative_id = auth.uid());

drop policy if exists "creatives update own inquiries" on public.inquiries;
create policy "creatives update own inquiries" on public.inquiries for update
  using (creative_id = auth.uid()) with check (creative_id = auth.uid());

-- Join requests: anyone may submit; reads are admin-only (service role bypasses RLS).
drop policy if exists "anyone can request to join" on public.join_requests;
create policy "anyone can request to join" on public.join_requests for insert
  with check (true);

-- Note: no select policy for join_requests. Only the service role (admin server)
-- can read them. Add an admin policy once Supabase Auth roles are defined.
