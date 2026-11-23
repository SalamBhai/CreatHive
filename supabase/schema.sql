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
  avatar_public_id text,
  banner_gradient text not null default '',
  banner_url text,
  banner_public_id text,
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
  media_public_id text,
  text_content text,
  body_html text,
  pdf_url text,
  cover_image_url text,
  cover_public_id text,
  gallery_images text[] not null default '{}',
  gallery_public_ids text[] not null default '{}',
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
-- Admin, campaigns, submissions, flags and audit log.
-- Run in the Supabase SQL editor. Safe to re-run.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Admin check usable from RLS policies (no service-role key in the browser).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  discipline text not null default 'ALL',
  reward text,
  deadline timestamptz,
  status text not null default 'OPEN', -- OPEN | CLOSED
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creative_id uuid not null references public.profiles(id) on delete cascade,
  piece_id uuid references public.pieces(id) on delete set null,
  note text,
  status text not null default 'OPEN', -- OPEN | REVIEWING | ACCEPTED | REJECTED
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null, -- piece | profile | inquiry
  target_id text not null,
  reason text not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  status text not null default 'OPEN', -- OPEN | RESOLVED
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;
alter table public.submissions enable row level security;
alter table public.flags enable row level security;
alter table public.audit_log enable row level security;

-- Campaigns: everyone signed in can see open briefs; admins manage all.
drop policy if exists "campaigns readable" on public.campaigns;
create policy "campaigns readable" on public.campaigns for select
  using (status = 'OPEN' or public.is_admin());
drop policy if exists "admins insert campaigns" on public.campaigns;
create policy "admins insert campaigns" on public.campaigns for insert
  with check (public.is_admin());
drop policy if exists "admins update campaigns" on public.campaigns;
create policy "admins update campaigns" on public.campaigns for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete campaigns" on public.campaigns;
create policy "admins delete campaigns" on public.campaigns for delete
  using (public.is_admin());

-- Submissions: creators see/manage their own; admins see/manage all.
drop policy if exists "creators read own submissions" on public.submissions;
create policy "creators read own submissions" on public.submissions for select
  using (creative_id = auth.uid() or public.is_admin());
drop policy if exists "creators submit" on public.submissions;
create policy "creators submit" on public.submissions for insert
  with check (creative_id = auth.uid() or public.is_admin());
drop policy if exists "admins update submissions" on public.submissions;
create policy "admins update submissions" on public.submissions for update
  using (public.is_admin()) with check (public.is_admin());

-- Flags: anyone can report; only admins can see and resolve.
drop policy if exists "anyone can flag" on public.flags;
create policy "anyone can flag" on public.flags for insert with check (true);
drop policy if exists "admins read flags" on public.flags;
create policy "admins read flags" on public.flags for select using (public.is_admin());
drop policy if exists "admins update flags" on public.flags;
create policy "admins update flags" on public.flags for update
  using (public.is_admin()) with check (public.is_admin());

-- Inquiries: admins may read across creators.
drop policy if exists "admins read inquiries" on public.inquiries;
create policy "admins read inquiries" on public.inquiries for select
  using (public.is_admin());

-- Audit log: admin only.
drop policy if exists "admins read audit" on public.audit_log;
create policy "admins read audit" on public.audit_log for select using (public.is_admin());
drop policy if exists "admins write audit" on public.audit_log;
create policy "admins write audit" on public.audit_log for insert
  with check (public.is_admin());
-- Privileged admin changes must be authorized on the server, never by a
-- client-side profile update (which would let any user self-grant is_admin).
-- Run in the Supabase SQL editor. Safe to re-run.

-- Tighten the self-update policy: a user may edit their own row but may NOT
-- change is_admin. Restrict it to non-privileged columns via a column list.
drop policy if exists "creatives update own profile" on public.profiles;
create policy "creatives update own profile" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Note: Postgres column-level privileges are the real guard for is_admin.
-- Revoke the ability to write is_admin from the authenticated role, then the
-- security-definer function below is the only way to change it.
revoke update (is_admin) on public.profiles from authenticated;

-- Admin-only RPC to grant or revoke another user's admin status.
create or replace function public.set_profile_admin(target_id uuid, make_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.profiles set is_admin = make_admin where id = target_id;
end;
$$;

revoke all on function public.set_profile_admin(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_profile_admin(uuid, boolean) to authenticated;

-- Applause integrity: one applause per signed-in user per piece.
-- Repeat clicks are idempotent (count unchanged), so applause cannot be
-- inflated by hammering the button. Run in the Supabase SQL editor.

create table if not exists public.applause_events (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (piece_id, user_id)
);

alter table public.applause_events enable row level security;

drop policy if exists "users read own applause" on public.applause_events;
create policy "users read own applause" on public.applause_events for select
  using (user_id = auth.uid());

drop policy if exists "users insert own applause" on public.applause_events;
create policy "users insert own applause" on public.applause_events for insert
  with check (user_id = auth.uid());

-- Atomic + idempotent. The unique constraint guarantees one event per
-- (piece, user); GET DIAGNOSTICS tells us whether this call created it, so
-- the counter increments exactly once no matter how many times they click.
-- CREATE OR REPLACE cannot rename an existing parameter — drop it first.
drop function if exists public.applaud_piece(uuid);
create or replace function public.applaud_piece(p_piece_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_inserted integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to applaud';
  end if;

  insert into public.applause_events (piece_id, user_id)
  values (p_piece_id, auth.uid())
  on conflict (piece_id, user_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.pieces
    set applause_count = applause_count + 1
    where id = p_piece_id;
  end if;

  select applause_count into v_count from public.pieces where id = p_piece_id;
  return v_count;
end;
$$;

revoke all on function public.applaud_piece(uuid) from public, anon;
grant execute on function public.applaud_piece(uuid) to authenticated;
-- Profile view counts: one view per browser-tab session per profile.
-- Run in the Supabase SQL editor. Safe to re-run.

create table if not exists public.profile_view_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_key text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, viewer_key)
);

alter table public.profile_view_events enable row level security;
-- No policies: reachable only through the definer function below.

create or replace function public.record_profile_view(p_profile_id uuid, p_viewer_key text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_inserted integer;
begin
  if p_viewer_key is null or length(p_viewer_key) > 128 then
    raise exception 'invalid viewer key';
  end if;

  insert into public.profile_view_events (profile_id, viewer_key)
  values (p_profile_id, p_viewer_key)
  on conflict (profile_id, viewer_key) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    -- stats is jsonb — merge viewsCount while preserving the other keys.
    update public.profiles
    set stats = stats || jsonb_build_object(
      'viewsCount', coalesce((stats->>'viewsCount')::int, 0) + 1
    )
    where id = p_profile_id;
  end if;

  select (stats->>'viewsCount')::int into v_count
  from public.profiles where id = p_profile_id;
  return v_count;
end;
$$;

revoke all on function public.record_profile_view(uuid, text) from public, anon;
grant execute on function public.record_profile_view(uuid, text) to anon, authenticated;
-- Audit trail + standard row metadata (created/modified/soft-delete).
-- Run in the Supabase SQL editor. Safe to re-run.

-- 1) Standard metadata columns on the main content tables -------------------
alter table public.profiles add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists updated_at timestamptz;
alter table public.profiles add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists is_deleted boolean not null default false;
alter table public.profiles add column if not exists deleted_at timestamptz;

alter table public.pieces add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.pieces add column if not exists updated_at timestamptz;
alter table public.pieces add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.pieces add column if not exists is_deleted boolean not null default false;
alter table public.pieces add column if not exists deleted_at timestamptz;

alter table public.campaigns add column if not exists updated_at timestamptz;
alter table public.campaigns add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.campaigns add column if not exists is_deleted boolean not null default false;
alter table public.campaigns add column if not exists deleted_at timestamptz;

alter table public.submissions add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.submissions add column if not exists updated_at timestamptz;
alter table public.submissions add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.submissions add column if not exists is_deleted boolean not null default false;
alter table public.submissions add column if not exists deleted_at timestamptz;

alter table public.flags add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.flags add column if not exists updated_at timestamptz;
alter table public.flags add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.flags add column if not exists is_deleted boolean not null default false;
alter table public.flags add column if not exists deleted_at timestamptz;

alter table public.inquiries add column if not exists updated_at timestamptz;
alter table public.inquiries add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.inquiries add column if not exists is_deleted boolean not null default false;
alter table public.inquiries add column if not exists deleted_at timestamptz;

-- 2) Keep updated_at / updated_by automatic on every update -----------------
create or replace function public.set_row_modified()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_modified on public.profiles;
create trigger trg_profiles_modified before update on public.profiles
  for each row execute function public.set_row_modified();
drop trigger if exists trg_pieces_modified on public.pieces;
create trigger trg_pieces_modified before update on public.pieces
  for each row execute function public.set_row_modified();
drop trigger if exists trg_campaigns_modified on public.campaigns;
create trigger trg_campaigns_modified before update on public.campaigns
  for each row execute function public.set_row_modified();
drop trigger if exists trg_submissions_modified on public.submissions;
create trigger trg_submissions_modified before update on public.submissions
  for each row execute function public.set_row_modified();
drop trigger if exists trg_flags_modified on public.flags;
create trigger trg_flags_modified before update on public.flags
  for each row execute function public.set_row_modified();
drop trigger if exists trg_inquiries_modified on public.inquiries;
create trigger trg_inquiries_modified before update on public.inquiries
  for each row execute function public.set_row_modified();

-- 3) Audit log: record every privileged admin action ------------------------
alter table public.audit_log add column if not exists target_type text;
alter table public.audit_log add column if not exists target_id uuid;

create or replace function public.log_admin_action(
  p_action text,
  p_target text default '',
  p_meta jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  insert into public.audit_log (admin_id, action, target, meta)
  values (auth.uid(), p_action, p_target, p_meta);
end;
$$;

revoke all on function public.log_admin_action(text, text, jsonb) from public, anon;
grant execute on function public.log_admin_action(text, text, jsonb) to authenticated;
