'use client';

import { useEffect, useState } from 'react';
import { WifiSlash } from '@phosphor-icons/react';

/** Registers the offline service worker and shows a quiet connectivity hint. */
export function PwaProvider() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
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
        .catch((error) => console.warn('[pwa] service worker registration failed', error));
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
