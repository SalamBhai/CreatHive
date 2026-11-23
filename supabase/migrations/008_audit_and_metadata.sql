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
