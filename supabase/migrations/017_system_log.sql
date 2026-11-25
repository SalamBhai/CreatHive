-- Client-reported PWA/service events, readable only by admins.
create table if not exists public.system_log (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info',
  source text not null,
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.system_log enable row level security;

drop policy if exists "admins read system log" on public.system_log;
create policy "admins read system log" on public.system_log for select
  using (public.is_admin());

create index if not exists system_log_created_idx on public.system_log (created_at desc);
