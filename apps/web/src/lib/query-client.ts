import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

/**
 * The data cache: de-duplicates requests, keeps answers for a while, and refetches
 * when the tab regains focus. One recipe for the app and the tests, so tests behave
 * like the real thing.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
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
}
