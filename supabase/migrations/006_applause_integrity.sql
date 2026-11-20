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
create or replace function public.applaud_piece(piece_id uuid)
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
  values (piece_id, auth.uid())
  on conflict (piece_id, user_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.pieces
    set applause_count = applause_count + 1
    where id = piece_id;
  end if;

  select applause_count into v_count from public.pieces where id = piece_id;
  return v_count;
end;
$$;

revoke all on function public.applaud_piece(uuid) from public, anon;
grant execute on function public.applaud_piece(uuid) to authenticated;
