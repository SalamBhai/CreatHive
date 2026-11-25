import { supabase, usingSupabase } from './supabase';
import { logWarn } from './logger';

/** Best-effort: email the recruiter after the creative decides an inquiry.
 *  Never blocks or fails the status change itself. */
export async function requestInquiryReplyEmail(inquiryId: string): Promise<void> {
  if (!usingSupabase || !supabase || typeof window === 'undefined') return;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const response = await fetch('/api/inquiries/reply', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ inquiryId }),
    });
    if (!response.ok) logWarn('inquiry', 'Reply email request failed', { status: response.status });
  } catch {
    // Email is best-effort by design.
  }
}
