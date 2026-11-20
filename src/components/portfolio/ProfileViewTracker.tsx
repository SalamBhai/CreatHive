'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/auth';
import { useRecordProfileView } from '@/lib/store';
import type { CreativeProfile } from '@/lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Counts one view per browser-tab session, client-side only — never during
 *  prerender, so bots/build passes can't inflate the number. */
export function ProfileViewTracker({ profile }: { profile: CreativeProfile }) {
  const session = useSession();
  const record = useRecordProfileView();

  useEffect(() => {
    // Skip mock profiles, hidden tabs, and the owner viewing their own page.
    if (!UUID.test(profile.id)) return;
    if (document.visibilityState !== 'visible') return;
    if (session?.userId === profile.id) return;

    const key = `creathive:view:${profile.id}`;
    let viewerKey = sessionStorage.getItem(key);
    if (!viewerKey) {
      viewerKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(key, viewerKey); // write first — blocks StrictMode double-fire
    }

    const timer = window.setTimeout(() => {
      record.mutate({ profileId: profile.id, viewerKey });
    }, 1500);
    return () => window.clearTimeout(timer);
    // Only re-run for a different profile — not on filters/re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  return null;
}
