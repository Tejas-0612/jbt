import type { RouteObject } from 'react-router';
import { ApplicationPage } from '@/features/applications/application-page';
import { NewApplicationPage } from '@/features/applications/new-application-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { NotFoundPage } from './not-found-page';
import { RootLayout } from './root-layout';

/*
 * React Router "data mode": routes are defined here, outside the components.
 * We don't use its data loaders; TanStack Query fetches data instead.
 * main.tsx turns them into the browser router; tests use an in-memory router
 * with the same routes (src/test/render.tsx).
 */
export const routes: RouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'applications/new', Component: NewApplicationPage },
      { path: 'applications/:id', Component: ApplicationPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
];
