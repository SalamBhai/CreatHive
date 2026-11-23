-- Studio piece reordering (up/down + drag) persists sort_order.
-- schema.sql already defines it; this migration brings older databases up to date.
alter table public.pieces add column if not exists sort_order integer not null default 0;
create index if not exists pieces_sort_order_idx on public.pieces (creative_id, sort_order);
