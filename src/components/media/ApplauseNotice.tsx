'use client';

import Link from 'next/link';

/** Shared, friendly feedback for a failed applaud (mostly: not signed in). */
export function ApplauseNotice({ message }: { message?: string }) {
  const raw = (message || '').toLowerCase();
  const needsSignIn = raw.includes('sign in') || raw.includes('auth');
  return (
    <p className="px-4 pb-3 text-[11px] font-semibold text-stone-600 md:px-5">
      {needsSignIn ? (
        <>
          <Link href="/studio" className="text-[#FF5A36] underline">Sign in</Link> or{' '}
          <Link href="/join" className="text-[#FF5A36] underline">join the hive</Link> to applaud.
        </>
      ) : (
        (message || 'Could not applaud. Please try again.')
      )}
    </p>
  );
}
