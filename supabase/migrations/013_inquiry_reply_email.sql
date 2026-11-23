-- One-shot guard for the creator → recruiter reply email.
alter table public.inquiries
  add column if not exists reply_email_sent_at timestamptz;
