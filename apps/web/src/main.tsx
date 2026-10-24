// Fonts are self-hosted (bundled with the app), so no requests go to Google.
import '@fontsource-variable/figtree';
import '@fontsource-variable/newsreader';
import './styles/globals.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { routes } from './app/router';
import { createQueryClient } from './lib/query-client';

const queryClient = createQueryClient();
const router = createBrowserRouter(routes);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html is missing <div id="root">');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
