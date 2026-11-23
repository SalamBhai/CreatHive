-- Inquiries are creator-scoped private messages between a creative and a
-- recruiter. Admins do not get a cross-creator view — RLS already limits
-- reads/writes to the owning creative and the public insert policy.
drop policy if exists "admins read inquiries" on public.inquiries;
