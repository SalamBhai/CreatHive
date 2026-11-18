import { Webhook } from 'standardwebhooks';
import { sendAuthEmail } from '@/lib/auth-email';

/**
 * Supabase Auth "Send Email" hook. Supabase generates the token, calls this
 * endpoint, and we deliver a branded message through Brevo. This completely
 * replaces Supabase's built-in mailer and templates.
 */

interface HookUser {
  email?: string;
  new_email?: string;
  user_metadata?: Record<string, unknown>;
}

interface HookEmailData {
  token?: string;
  token_hash?: string;
  token_new?: string;
  token_hash_new?: string;
  redirect_to?: string;
  site_url?: string;
  email_action_type?: string;
}

interface HookEvent {
  user?: HookUser;
  email_data?: HookEmailData;
}

const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').host;
  } catch {
    return '';
  }
})();

function verifyUrl(tokenHash: string, action: string, redirectTo: string): string {
  const params = new URLSearchParams({ token: tokenHash, type: action });
  if (redirectTo) params.set('redirect_to', redirectTo);
  return `https://${SUPABASE_HOST}/auth/v1/verify?${params.toString()}`;
}

function ok() {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function retryable(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 503,
    headers: { 'Content-Type': 'application/json', 'retry-after': 'true' },
  });
}

export async function POST(request: Request) {
  const payload = await request.text();
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;

  if (secret) {
    try {
      const wh = new Webhook(secret.replace(/^v1,whsec_/, ''));
      wh.verify(payload, Object.fromEntries(request.headers));
    } catch (error) {
      console.error('[auth-email] invalid hook signature', error);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[auth-email] SEND_EMAIL_HOOK_SECRET is not configured');
    return new Response(JSON.stringify({ error: 'Not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    console.warn('[auth-email] no hook secret configured — accepting unsigned payload in dev');
  }

  let event: HookEvent;
  try {
    event = JSON.parse(payload) as HookEvent;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = event.user || {};
  const data = event.email_data || {};
  const action = data.email_action_type || 'signup';
  const displayName = String(user.user_metadata?.display_name || '');
  const redirectTo = data.redirect_to || data.site_url || '';

  const send = async (to: string, tokenHash: string, token: string, extra?: { newEmail?: string }) => {
    if (!to) return true;
    return sendAuthEmail({
      to,
      action,
      token,
      displayName,
      newEmail: extra?.newEmail,
      url: tokenHash ? verifyUrl(tokenHash, action, redirectTo) : undefined,
    });
  };

  try {
    if (action === 'reauthentication') {
      const sent = await send(user.email || '', '', data.token || '');
      return sent ? ok() : retryable('Failed to send verification code');
    }

    // Secure email change: Supabase sends two OTPs. The `_new` hash belongs to
    // the CURRENT address (quirk preserved by Supabase for compatibility).
    if (action === 'email_change' && data.token_hash_new) {
      const toCurrent = await send(user.email || '', data.token_hash_new, data.token || '');
      const toNew = await send(user.new_email || '', data.token_hash || '', data.token_new || '', {
        newEmail: user.new_email,
      });
      return toCurrent && toNew ? ok() : retryable('Failed to send email change confirmation');
    }

    const sent = await send(
      user.email || '',
      data.token_hash || '',
      data.token || '',
      { newEmail: user.new_email }
    );
    return sent ? ok() : retryable('Failed to send auth email');
  } catch (error) {
    console.error('[auth-email] send failed', error);
    return retryable('Failed to send auth email');
  }
}
