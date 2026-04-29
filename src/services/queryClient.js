import { QueryClient } from '@tanstack/react-query';

/**
 * Single QueryClient shared by the whole app.
 *
 * Defaults are tuned for a financial dashboard:
 *   - 30s staleTime to avoid hammering the backend on tab switches
 *   - 5 min cacheTime so dropping back into a page is instant
 *   - retry: 1 - fail fast, the user can hit refresh
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        30_000,
      gcTime:           5 * 60_000,
      retry:            1,
      refetchOnWindowFocus: false,
    },
  },
});
