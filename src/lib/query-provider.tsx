'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2,
            // Re-check on focus so data changed elsewhere (or by another user) updates.
            refetchOnWindowFocus: true,
            // No global keepPreviousData — on key changes (profile/filter/user) it
            // showed the previous user's or filter's data as if it were current.
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
