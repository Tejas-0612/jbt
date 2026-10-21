import { createBrowserRouter } from 'react-router';
import { StatusPage } from '@/features/system-status/status-page';
import { NotFoundPage } from './not-found-page';
import { RootLayout } from './root-layout';

/*
 * React Router "data mode": routes are defined here, outside the components.
 * We don't use its data loaders; TanStack Query fetches data instead.
 */
export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { index: true, Component: StatusPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
