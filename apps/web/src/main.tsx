// Fonts are self-hosted (bundled with the app), so no requests go to Google.
import '@fontsource-variable/figtree';
import '@fontsource-variable/newsreader';
import './styles/globals.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './app/router';

/** Caches API data, de-duplicates requests and refetches when the tab regains focus. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000 },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html is missing <div id="root">');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
