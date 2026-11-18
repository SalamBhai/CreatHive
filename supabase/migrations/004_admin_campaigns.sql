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
