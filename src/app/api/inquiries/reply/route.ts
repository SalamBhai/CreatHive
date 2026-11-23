import { getUserFromRequest } from '@/lib/supabase-server';
import { getAdminDb } from '@/lib/supabase-admin';
import { sendInquiryReplyEmail } from '@/lib/email';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/** Email the recruiter the creative's decision + private note. Only the
 *  owning creative can trigger it, and a one-shot guard prevents duplicates. */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return json({ error: 'Sign in first' }, 401);

  const body = await request.json().catch(() => null);
  const id = typeof body?.inquiryId === 'string' ? body.inquiryId : '';
  if (!UUID.test(id)) return json({ error: 'Invalid inquiry' }, 400);

  const db = getAdminDb();
  if (!db) return json({ skipped: 'not configured' });

  const { data: inquiry } = await db.from('inquiries').select('*').eq('id', id).maybeSingle();
  if (!inquiry || inquiry.creative_id !== user.id) return json({ error: 'Not found' }, 404);
  if (!['RESPONDED', 'DECLINED'].includes(inquiry.status)) return json({ skipped: true });
  if (inquiry.reply_email_sent_at) return json({ skipped: true });

  const { data: claimed } = await db
    .from('inquiries')
    .update({ reply_email_sent_at: new Date().toISOString() })
    .eq('id', id)
    .is('reply_email_sent_at', null)
    .select('id')
    .maybeSingle();
  if (!claimed) return json({ skipped: true });

  const { data: profile } = await db
    .from('profiles')
    .select('display_name, username, social_links')
    .eq('id', user.id)
    .maybeSingle();
  const socials = (profile?.social_links || {}) as Record<string, unknown>;
  const replyTo =
    typeof socials.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(socials.email)
      ? socials.email
      : undefined;

  const sent = await sendInquiryReplyEmail({
    to: String(inquiry.sender_email || ''),
    senderName: String(inquiry.sender_name || ''),
    creativeName: String(profile?.display_name || 'A CreatHive creative'),
    creativeUsername: String(profile?.username || 'sheriff'),
    status: inquiry.status as 'RESPONDED' | 'DECLINED',
    note: inquiry.reply_note ? String(inquiry.reply_note) : undefined,
    replyTo,
  });
  if (!sent) {
    await db.from('inquiries').update({ reply_email_sent_at: null }).eq('id', id);
  }
  return json({ ok: sent });
}
