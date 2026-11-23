import { getUserFromRequest } from '@/lib/supabase-server';
import { getAdminDb } from '@/lib/supabase-admin';

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/** Store the current browser's push endpoint for the signed-in user. */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return json({ error: 'Sign in first' }, 401);

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  const p256dh = typeof body?.p256dh === 'string' ? body.p256dh : '';
  const auth = typeof body?.auth === 'string' ? body.auth : '';
  let httpsEndpoint = false;
  try {
    httpsEndpoint = new URL(endpoint).protocol === 'https:';
  } catch {
    httpsEndpoint = false;
  }
  const keyPattern = /^[A-Za-z0-9_-]{20,512}$/;
  if (!httpsEndpoint || !keyPattern.test(p256dh) || !keyPattern.test(auth)) {
    return json({ error: 'Invalid subscription' }, 400);
  }

  const db = getAdminDb();
  if (!db) return json({ error: 'Push is not configured' }, 503);

  const { error } = await db.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh, auth },
    { onConflict: 'endpoint' }
  );
  if (error) {
    console.error('[push] could not store subscription', error.message);
    return json({ error: 'Could not save subscription' }, 500);
  }
  return json({ ok: true });
}

/** Remove one endpoint when the user turns notifications off. */
export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return json({ error: 'Sign in first' }, 401);

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  if (!endpoint) return json({ error: 'Invalid subscription' }, 400);

  const db = getAdminDb();
  if (!db) return json({ error: 'Push is not configured' }, 503);

  const { error } = await db
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);
  if (error) return json({ error: 'Could not remove subscription' }, 500);
  return json({ ok: true });
}
