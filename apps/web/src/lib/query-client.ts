import { QueryCache, QueryClient } from '@tanstack/react-query';
import { meKey } from '@/features/auth/api';
import { ApiError } from './api';

/**
 * The data cache: de-duplicates requests, keeps answers for a while, and refetches
 * when the tab regains focus. One recipe for the app and the tests, so tests behave
 * like the real thing.
 */
export function createQueryClient(): QueryClient {
  const client = new QueryClient({
    queryCache: new QueryCache({
      // A 401 from any page's data means the session ended while the app was open
      // (30 days unused, or signed out in another tab). Ask /me again: it 401s too,
      // and the sign-in check (RequireSignIn) sends the user to the sign-in page.
      onError: (error, query) => {
        const sessionEnded = error instanceof ApiError && error.status === 401;
        if (sessionEnded && query.queryKey[0] !== meKey[0]) {
          void client.invalidateQueries({ queryKey: meKey });
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Answers count as fresh for 30 s: opening a page again doesn't refetch at once.
        staleTime: 30_000,
        // A 4xx (not found, bad request…) won't change by asking again; a network
        // hiccup or a 5xx might, so those are retried a few times.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
          failureCount < 3,
      },
    },
  });
  return client;
}
