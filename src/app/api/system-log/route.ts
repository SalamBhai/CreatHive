import { getAdminDb } from '@/lib/supabase-admin';

/** Client-reported PWA/service events. Public but tightly bounded: only a
 *  small allowlist of sources, short messages, and 12 events per minute per IP. */

const SOURCES = new Set(['pwa', 'push', 'upload']);
const LEVELS = new Set(['info', 'warn', 'error']);
const attempts = new Map<string, number[]>();

function limited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((time) => now - time < 60_000);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 500) attempts.clear();
  return recent.length > 12;
}

export async function POST(request: Request) {
  const db = getAdminDb();
  if (!db) return Response.json({ ok: false }, { status: 503 });

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (limited(ip)) return Response.json({ ok: false }, { status: 429 });

  const body = await request.json().catch(() => null);
  const source = typeof body?.source === 'string' ? body.source : '';
  const level = typeof body?.level === 'string' ? body.level : 'info';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!SOURCES.has(source) || !LEVELS.has(level) || !message || message.length > 160) {
    return Response.json({ error: 'Invalid event' }, { status: 400 });
  }

  const context: Record<string, string> = {};
  if (body?.context && typeof body.context === 'object') {
    for (const [key, value] of Object.entries(body.context).slice(0, 5)) {
      if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,24}$/.test(key)) continue;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        context[key] = String(value).slice(0, 60);
      }
    }
  }

  const { error } = await db.from('system_log').insert({
    level,
    source,
    message,
    context,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('[system-log] insert failed', error.message);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
