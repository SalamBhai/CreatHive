'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth';

interface StudioLinkProps {
  children: React.ReactNode;
  className?: string;
}

/** Routes signed-in creators to their Studio; everyone else to sign-in/join. */
export function StudioLink({ children, className }: StudioLinkProps) {
  const session = useSession();
  return (
    <Link href={session ? '/studio' : '/join'} className={className}>
      {children}
    </Link>
  );
}
