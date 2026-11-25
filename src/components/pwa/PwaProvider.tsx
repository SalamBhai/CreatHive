'use client';

import { useEffect, useRef, useState } from 'react';
import { WifiSlash } from '@phosphor-icons/react';
import { reportClientEvent } from '@/lib/client-log';

/** Registers the offline service worker and shows a quiet connectivity hint. */
export function PwaProvider() {
  const [offline, setOffline] = useState(false);
  const offlineChange = useRef<boolean | null>(null);

  useEffect(() => {
    const update = () => {
      const offlineNow = !navigator.onLine;
      setOffline(offlineNow);
      if (typeof window !== 'undefined' && offlineChange.current !== offlineNow) {
        offlineChange.current = offlineNow;
        reportClientEvent('pwa', offlineNow ? 'Device went offline' : 'Device back online', offlineNow ? 'warn' : 'info');
      }
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    // Skip dev: a cached shell would serve stale assets during HMR.
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(() => reportClientEvent('pwa', 'Service worker registered'))
        .catch((error) =>
          reportClientEvent('pwa', 'Service worker registration failed', 'warn', {
            message: error instanceof Error ? error.message : 'unknown',
          })
        );
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    return () => window.removeEventListener('load', register);
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 top-2 z-[100] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-stone-200 bg-white px-4 py-2 text-[11px] font-semibold text-[#18181B] shadow-[0_8px_30px_rgba(24,24,27,0.12)]"
    >
      <WifiSlash size={14} weight="bold" className="text-[#FF5A36]" />
      Offline. Showing your last saved pages.
    </div>
  );
}
