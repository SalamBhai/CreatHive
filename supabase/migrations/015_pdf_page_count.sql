-- Page count reported at PDF upload, so the post can render pages inline.
alter table public.pieces add column if not exists pdf_page_count integer;
