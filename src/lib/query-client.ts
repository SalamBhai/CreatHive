import { QueryClient } from '@tanstack/react-query';

/** One client for the whole app — auth can clear it on identity changes. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
