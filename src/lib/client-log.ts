'use client';

/** Fire-and-forget reporter for PWA/service events. Never blocks the app and
 *  never throws — a logging failure must not break the user experience. */
export function reportClientEvent(
  source: 'pwa' | 'push' | 'upload',
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
  context?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return;
  try {
    void fetch('/api/system-log', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source, message, level, context }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // best effort
  }
}
