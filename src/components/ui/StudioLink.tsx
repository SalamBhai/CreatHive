'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, useAuthReady } from '@/lib/auth';
import { useIsAdmin } from '@/lib/store';

interface StudioLinkProps {
  children: React.ReactNode;
  className?: string;
}

/** Routes signed-in creators to their Studio (admins to Admin); everyone else to join. */
export function StudioLink({ children, className }: StudioLinkProps) {
  const session = useSession();
  const ready = useAuthReady();
  const isAdmin = useIsAdmin();
  const href = !ready ? '/studio' : isAdmin ? '/admin' : session ? '/studio' : '/join';
  return (
    <Link href={href} className={className} aria-busy={!ready}>
      {children}
    </Link>
  );
}
