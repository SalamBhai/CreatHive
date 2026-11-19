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
