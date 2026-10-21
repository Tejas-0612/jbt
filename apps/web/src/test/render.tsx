import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

/**
 * Renders a page with what the real app gives it: data fetching (TanStack Query)
 * and routing (an in-memory router, so links work without a browser address bar).
 * Each call gets its own fresh query cache, so no test sees another test's data.
 */
export function renderPage(page: ReactElement, { path = '/' }: { path?: string } = {}) {
  const queryClient = new QueryClient({
    // No automatic retries in tests: a failure should show up immediately.
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter([{ path: '*', element: page }], { initialEntries: [path] });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
