-- Web Push (VAPID — no paid service required).
-- Browser subscriptions are stored per user; service role reads them when
-- delivering. notified_at makes each event's push one-shot (no double sends).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

drop policy if exists "users manage own push subscriptions" on public.push_subscriptions;
create policy "users manage own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One-shot guards, claimed atomically by the notify route.
alter table public.inquiries add column if not exists notified_at timestamptz;
alter table public.submissions add column if not exists notified_at timestamptz;
alter table public.submissions add column if not exists decision_notified_at timestamptz;
