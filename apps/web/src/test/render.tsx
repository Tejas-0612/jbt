import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/router';
import { createQueryClient } from '@/lib/query-client';

/**
 * A fresh cache per test (no test sees another's data), with the app's own settings,
 * except: no automatic retries, so a failure shows up immediately.
 */
function newQueryClient() {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: false } });
  return client;
}

/**
 * Renders a page with what the real app gives it: data fetching (TanStack Query)
 * and routing (an in-memory router, so links work without a browser address bar).
 */
export function renderPage(page: ReactElement, { path = '/' }: { path?: string } = {}) {
  const router = createMemoryRouter([{ path: '*', element: page }], { initialEntries: [path] });

  return render(
    <QueryClientProvider client={newQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

/**
 * Renders the WHOLE app (the real routes, the shell, every page) starting at `path`.
 * Use it to click through like a user: links and redirects really change pages.
 * `router.state.location` tells where the app ended up.
 */
export function renderApp({ path = '/' }: { path?: string } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  const result = render(
    <QueryClientProvider client={newQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, router };
}
