import { CircleNotchIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { signInPath, useMe } from './api';

/**
 * Wraps every page that needs a signed-in user. Asks the API who is signed in
 * (GET /me) and:
 * - nobody (401, also when a session ends while the app is open): go to the sign-in
 *   page, remembering this page so sign-in comes back here;
 * - someone: show the page;
 * - the API can't be reached: say so, with Try again.
 */
export function RequireSignIn() {
  const me = useMe();
  const location = useLocation();

  if (me.error instanceof ApiError && me.error.status === 401) {
    return (
      <Navigate to={signInPath(location.pathname + location.search + location.hash)} replace />
    );
  }
  // Signed in earlier: a failed re-check (say, a network blip) keeps the app on screen.
  if (me.data) return <Outlet />;
  if (me.isError) {
    return (
      <FullPage>
        <WarningCircleIcon aria-hidden weight="fill" className="size-6 text-destructive" />
        <p role="alert" className="text-center">
          Couldn&apos;t reach the server. Check your connection, then try again.
        </p>
        <Button variant="outline" onClick={() => void me.refetch()}>
          Try again
        </Button>
      </FullPage>
    );
  }
  return (
    <FullPage>
      <CircleNotchIcon aria-hidden className="size-6 animate-spin text-muted-foreground" />
      <p className="sr-only">Loading…</p>
    </FullPage>
  );
}

function FullPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">{children}</div>
  );
}
