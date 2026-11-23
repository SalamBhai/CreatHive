import { getUserFromRequest } from '@/lib/supabase-server';
import { getAdminDb } from '@/lib/supabase-admin';
import { sendPushToUsers } from '@/lib/server-push';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENTS = ['new_inquiry', 'new_submission', 'submission_decision'] as const;
type Event = (typeof EVENTS)[number];
const MAX_AGE_MS = 10 * 60 * 1000;
/** Public inquiries can be minted by anyone, so cap each creative at one push
 *  per five minutes on top of the per-row one-shot guard. */
const INQUIRY_COOLDOWN_MS = 5 * 60 * 1000;

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function isRecent(timestamp: unknown): boolean {
  if (typeof timestamp !== 'string') return false;
  const age = Date.now() - Date.parse(timestamp);
  return Number.isFinite(age) && age >= -60_000 && age <= MAX_AGE_MS;
}

/** Deliver a push for a row that was just written. Each event has a one-shot
 *  guard; it is released again if delivery fails, so a transient error cannot
 *  permanently suppress a notification. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const event = body?.event as Event | undefined;
  const id: string = typeof body?.id === 'string' ? body.id : '';
  if (!event || !EVENTS.includes(event) || !UUID.test(id)) {
    return json({ error: 'Invalid event' }, 400);
  }

  const user = await getUserFromRequest(request);
  if (event !== 'new_inquiry' && !user) return json({ error: 'Sign in first' }, 401);

  const db = getAdminDb();
  if (!db) return json({ skipped: 'not configured' }); // push is optional
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - MAX_AGE_MS).toISOString();

  if (event === 'new_inquiry') {
    // Read first: validating before claiming means a forged or stale id can
    // never burn the one-shot guard.
    const { data: row } = await db.from('inquiries').select('*').eq('id', id).maybeSingle();
    if (!row || !isRecent(row.created_at)) return json({ skipped: true });

    const cooldown = new Date(Date.now() - INQUIRY_COOLDOWN_MS).toISOString();
    const { data: recent } = await db
      .from('inquiries')
      .select('id')
      .eq('creative_id', row.creative_id)
      .gte('notified_at', cooldown)
      .neq('id', id)
      .limit(1);
    if (recent?.length) return json({ skipped: true });

    const { data: claimed } = await db
      .from('inquiries')
      .update({ notified_at: now })
      .eq('id', id)
      .is('notified_at', null)
      .gte('created_at', cutoff)
      .select('*')
      .maybeSingle();
    if (!claimed) return json({ skipped: true });

    const kind = String(row.event_type || 'INQUIRY').toLowerCase().replace(/_/g, ' ');
    const sent = await sendPushToUsers([row.creative_id], {
      title: 'New booking inquiry',
      body: `${row.sender_name || 'Someone'} · ${kind}`,
      url: '/studio?view=inquiries',
      tag: `inquiry-${row.id}`,
    });
    if (sent === 0) await releaseGuard(db, 'inquiries', id, 'notified_at');
    return json({ ok: sent > 0 });
  }

  if (event === 'new_submission') {
    // Check ownership BEFORE claiming the guard, so a forged id cannot burn it.
    const { data: row } = await db.from('submissions').select('*').eq('id', id).maybeSingle();
    if (!row || row.creative_id !== user!.id || !isRecent(row.created_at)) {
      return json({ skipped: true });
    }
    const { data: claimed } = await db
      .from('submissions')
      .update({ notified_at: now })
      .eq('id', id)
      .is('notified_at', null)
      .select('id')
      .maybeSingle();
    if (!claimed) return json({ skipped: true });

    const { data: admins } = await db
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .eq('is_deleted', false);
    const sent = await sendPushToUsers((admins || []).map((admin) => admin.id), {
      title: 'New campaign submission',
      body: 'A creative submitted work for review.',
      url: '/admin',
      tag: `submission-${row.id}`,
    });
    if (sent === 0) await releaseGuard(db, 'submissions', id, 'notified_at');
    return json({ ok: sent > 0 });
  }

  // submission_decision — admin only, sent to the submitting creative.
  const { data: adminRow } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .maybeSingle();
  if (!adminRow?.is_admin) return json({ error: 'Admins only' }, 403);

  const { data: submission } = await db.from('submissions').select('*').eq('id', id).maybeSingle();
  if (
    !submission ||
    !['ACCEPTED', 'REJECTED'].includes(submission.status) ||
    !isRecent(submission.reviewed_at || submission.updated_at)
  ) {
    return json({ skipped: true });
  }
  const { data: claimed } = await db
    .from('submissions')
    .update({ decision_notified_at: now })
    .eq('id', id)
    .is('decision_notified_at', null)
    .select('id')
    .maybeSingle();
  if (!claimed) return json({ skipped: true });

  const accepted = submission.status === 'ACCEPTED';
  const sent = await sendPushToUsers([submission.creative_id], {
    title: accepted ? 'Submission accepted' : 'Submission update',
    body: accepted ? 'Your campaign submission was accepted.' : 'Your campaign submission was reviewed.',
    url: '/studio?view=pieces',
    tag: `decision-${submission.id}`,
  });
  if (sent === 0) await releaseGuard(db, 'submissions', id, 'decision_notified_at');
  return json({ ok: sent > 0 });
}

/** Undo a claim when nothing could be delivered, so the event can be retried. */
async function releaseGuard(
  db: NonNullable<ReturnType<typeof getAdminDb>>,
  table: 'inquiries' | 'submissions',
  id: string,
  column: 'notified_at' | 'decision_notified_at'
) {
  await db.from(table).update({ [column]: null }).eq('id', id);
}
