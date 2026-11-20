-- CreatHive — ALL migrations in order. Safe to paste and run repeatedly.


-- ===== 001_upload_public_ids.sql =====

-- Run once in the Supabase SQL editor if you applied schema.sql before uploads
-- were wired up. Safe to re-run.
alter table public.profiles
  add column if not exists avatar_public_id text;

alter table public.pieces
  add column if not exists media_public_id text,
  add column if not exists cover_public_id text,
  add column if not exists gallery_public_ids text[] not null default '{}';



-- ===== 002_backfill_is_ypat_data.sql =====

-- Older signups were inserted with a hardcoded is_ypat_data = false.
-- Backfill them so the column matches what the app already assumes:
-- every row in Supabase is real YPAT data.
update public.profiles
set is_ypat_data = true,
    source = case when source in ('mock', 'campaign') then source else 'live' end
where is_ypat_data is distinct from true;



-- ===== 003_banner_upload.sql =====

-- Run in the Supabase SQL editor to support banner uploads. Safe to re-run.
alter table public.profiles
  add column if not exists banner_url text,
  add column if not exists banner_public_id text;



-- ===== 004_admin_campaigns.sql =====

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



-- ===== 005_admin_rpc.sql =====

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



-- ===== 006_applause_integrity.sql =====

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

-- Atomic + idempotent. Parameter is named p_piece_id (not piece_id) to avoid
-- ambiguity with the applause_events.piece_id column in ON CONFLICT.
-- CREATE OR REPLACE cannot rename an existing parameter, so drop it first.
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



-- ===== 007_profile_views.sql =====

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

