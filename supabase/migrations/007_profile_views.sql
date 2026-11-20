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
