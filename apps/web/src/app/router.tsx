import type { RouteObject } from 'react-router';
import { ApplicationPage } from '@/features/applications/application-page';
import { ApplicationsPage } from '@/features/applications/applications-page';
import { LoginPage } from '@/features/auth/login-page';
import { RequireSignIn } from '@/features/auth/require-sign-in';
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
  // The only page for signed-out visitors. Outside the app's frame.
  { path: 'login', Component: LoginPage },
  {
    // Everything else needs a signed-in user (signed out → /login?returnTo=…).
    Component: RequireSignIn,
    children: [
      {
        Component: RootLayout,
        children: [
          { index: true, Component: DashboardPage },
          { path: 'applications', Component: ApplicationsPage },
          { path: 'applications/new', Component: NewApplicationPage },
          { path: 'applications/:id', Component: ApplicationPage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];
