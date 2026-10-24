import { isSafeReturnTo, meSchema, type DevLoginInput } from '@jbt/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getJson, postNoContent } from '@/lib/api';

/** Cache key for the signed-in user. */
export const meKey = ['me'] as const;

/** Who is signed in. Fails with a 401 ApiError when nobody is. */
export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: () => getJson('/api/v1/me', meSchema) });
}

/** Development only: sign in as sample user A or B (the API has no such route in production). */
export function useDevLogin() {
  return useMutation({
    mutationFn: (input: DevLoginInput) => postNoContent('/api/v1/auth/dev-login', input),
  });
}

export function useSignOut() {
  return useMutation({ mutationFn: () => postNoContent('/api/v1/auth/logout') });
}

/**
 * The "Continue with Google" link. A real page navigation, not a fetch: the API
 * answers with a redirect to Google. It carries the browser's timezone, which a
 * new account keeps ("what is today?" depends on it).
 */
export function googleSignInHref(returnTo: string): string {
  const params = new URLSearchParams({
    returnTo,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  return `/api/v1/auth/google?${params.toString()}`;
}

/** The page to open after signing in: `returnTo` if it's a path on our site, else the dashboard. */
export function safeReturnTo(returnTo: string | null): string {
  return returnTo !== null && isSafeReturnTo(returnTo) ? returnTo : '/';
}

/** The sign-in page's address, remembering where the user was going. */
export function signInPath(returnTo: string): string {
  return returnTo === '/' ? '/login' : `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
