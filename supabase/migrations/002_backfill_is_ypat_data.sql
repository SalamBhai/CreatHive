-- Older signups were inserted with a hardcoded is_ypat_data = false.
-- Backfill them so the column matches what the app already assumes:
-- every row in Supabase is real YPAT data.
update public.profiles
set is_ypat_data = true,
    source = case when source in ('mock', 'campaign') then source else 'live' end
where is_ypat_data is distinct from true;
