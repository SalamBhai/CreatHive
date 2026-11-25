import { createClient } from '@supabase/supabase-js';
import { logError } from './logger';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Server-side Supabase client for route handlers. Sessions are intentionally
 * not persisted: each request is a one-shot operation, and RLS remains the
 * only access boundary. Never put a service-role key here.
 */
export const serverSupabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;

/** Read a bearer token forwarded by the browser client (used by upload routes). */
export async function getUserFromRequest(request: Request) {
  if (!serverSupabase) return null;
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  try {
    const { data, error } = await serverSupabase.auth.getUser(token);
    return error ? null : data.user;
  } catch (error) {
    // A failed auth-service call is a real incident, not "no user". Log it and
    // let the caller report a service problem rather than a missing session.
    logError('auth', 'Token verification failed', error);
    return null;
  }
}
