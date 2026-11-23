'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Bell, BellSlash } from '@phosphor-icons/react';
import { Tooltip } from '@/components/ui/Tooltip';
import { disablePush, enablePush, isPushSubscribed, pushSupported } from '@/lib/push';

/** Capability is external to React; useSyncExternalStore keeps SSR and the
 *  first client render identical (false on both) before the browser takes over. */
const subscribe = () => () => {};

/** Small, quiet opt-in for Web Push (free VAPID notifications). */
export function PushOptIn({ compact = false }: { compact?: boolean }) {
  const supported = useSyncExternalStore(subscribe, pushSupported, () => false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    isPushSubscribed()
      .then((value) => active && setSubscribed(value))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Hidden when unsupported or when VAPID keys are not configured.
  if (!supported) return null;

  const toggle = async () => {
    setBusy(true);
    setError('');
    try {
      if (subscribed) {
        await disablePush();
        setSubscribed(false);
      } else {
        setSubscribed(await enablePush());
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Notifications unavailable');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end">
      <Tooltip
        label={subscribed ? 'Turn off notifications' : 'Turn on notifications'}
        side="bottom"
        onClick={() => void toggle()}
        triggerClassName={
          compact
            ? `rounded-xl border bg-white p-2 transition-colors disabled:opacity-50 ${
                subscribed
                  ? 'border-[#FF5A36] text-[#FF5A36]'
                  : 'border-stone-200 text-stone-500 hover:border-[#FF5A36] hover:text-[#FF5A36]'
              }`
            : `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                subscribed
                  ? 'border-[#FF5A36] bg-[#FFF2EE] text-[#FF5A36]'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-[#FF5A36] hover:text-[#FF5A36]'
              }`
        }
      >
        {subscribed ? <Bell size={15} weight="fill" /> : <BellSlash size={15} weight="bold" />}
        {!compact && <span>{busy ? 'Saving…' : subscribed ? 'Notifications on' : 'Notify me'}</span>}
      </Tooltip>
      {error ? <span className="mt-1 text-[10px] text-red-600">{error}</span> : null}
    </span>
  );
}
