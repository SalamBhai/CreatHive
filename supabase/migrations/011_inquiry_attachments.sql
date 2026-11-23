-- Richer inquiry workflow: reference images + review/response timeline.
alter table public.inquiries
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists reviewed_at timestamptz,
  add column if not exists responded_at timestamptz,
  add column if not exists reply_note text;
