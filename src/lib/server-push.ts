import * as webpush from 'web-push';
import { getAdminDb } from './supabase-admin';

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

let vapidReady = false;

function configureVapid(): boolean {
  if (vapidReady) return true;
  // Same public key the browser subscribes with — one canonical env var.
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:creathivee@gmail.com',
    publicKey,
    privateKey
  );
  vapidReady = true;
  return true;
}

/** Send to every subscription belonging to the given user ids. Expired
 *  subscriptions (410/404) are removed so the table stays clean. */
export async function sendPushToUsers(userIds: string[], message: PushMessage): Promise<number> {
  const recipients = [...new Set(userIds.filter(Boolean))];
  if (!recipients.length || !configureVapid()) return 0;

  const db = getAdminDb();
  if (!db) return 0;

  const { data: subscriptions, error } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', recipients);
  if (error) {
    console.error('[push] subscription lookup failed', error.message);
    return 0;
  }

  const payload = JSON.stringify(message);
  let sent = 0;
  await Promise.all(
    (subscriptions || []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await db.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.warn('[push] delivery failed', status ?? String(error));
        }
      }
    })
  );
  return sent;
}
