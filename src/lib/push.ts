import { supabase, usingSupabase } from './supabase';

export type PushEvent = 'new_inquiry' | 'new_submission' | 'submission_decision';

/** VAPID public keys are public by design — safe to ship in the browser bundle. */
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof atob === 'function' ? atob(base64) : '';
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!PUBLIC_KEY &&
    usingSupabase // push needs Supabase auth + server-side subscription storage
  );
}

async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  return !!(await registration?.pushManager.getSubscription());
}

/** Ask for permission, subscribe the SW, and store the endpoint server-side. */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported()) throw new Error('Notifications are not configured');
  // Prove we can persist the subscription before asking for permission.
  const token = await accessToken();
  if (!token) throw new Error('Sign in to enable notifications');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  const created = !subscription;
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    });
  }

  const keys = subscription.toJSON().keys;
  if (!keys?.p256dh || !keys?.auth) {
    if (created) await subscription.unsubscribe();
    throw new Error('Browser did not return a valid subscription');
  }

  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    }),
  });
  if (!response.ok) {
    if (created) await subscription.unsubscribe();
    throw new Error('Could not save your notification settings');
  }
  return true;
}

export async function disablePush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const token = await accessToken();
  if (token) {
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined);
  }
  await subscription.unsubscribe();
}

/** Fire-and-forget: a failed notification must never fail the user's action. */
export async function notifyPush(event: PushEvent, id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const token = await accessToken();
    await fetch('/api/push/notify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ event, id }),
    });
  } catch {
    // Notifications are best-effort by design.
  }
}
