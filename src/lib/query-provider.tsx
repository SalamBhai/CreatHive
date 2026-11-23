'use client';

import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from './query-client';
import { idbPersister } from './query-persistence';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: idbPersister,
        buster: 'v1',
        maxAge: 1000 * 60 * 60 * 24 * 7, // keep restored data for up to 7 days
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
