-- PDF attachments with derived page images. The PDF is the source artifact;
-- page images are the mobile-friendly presentation layer.
alter table public.pieces
  add column if not exists pdf_public_id text,
  add column if not exists pdf_page_images text[] not null default '{}',
  add column if not exists pdf_page_public_ids text[] not null default '{}',
  add column if not exists pdf_cover_page integer;
