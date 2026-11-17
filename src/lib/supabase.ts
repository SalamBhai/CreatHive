import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Browser client using the publishable key. All access control is enforced by
 * Row Level Security in supabase/schema.sql — never put a service-role key here.
 */
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

export const usingSupabase =
  process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase' && supabase !== null;
