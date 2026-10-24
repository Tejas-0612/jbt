import { z } from 'zod';

/** GET /api/v1/me: the signed-in user. */
export const meSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  name: z.string(),
  // IANA name, e.g. "Asia/Kolkata".
  timezone: z.string(),
});
export type Me = z.infer<typeof meSchema>;

/** POST /api/v1/auth/dev-login (development and tests only): sign in as sample user A or B. */
export const devLoginInputSchema = z.strictObject({ user: z.enum(['a', 'b']) });
export type DevLoginInput = z.infer<typeof devLoginInputSchema>;

/**
 * Why a Google sign-in didn't work. The API sends the browser to /login?error=<code>,
 * and the login page shows a message for each.
 */
export const SIGN_IN_ERRORS = [
  'cancelled', // the user pressed Cancel on Google's page
  'expired', // the sign-in took over 10 minutes, or the answer didn't belong to this browser
  'failed', // Google couldn't be reached, or its answer failed a check
  'unverified_email', // Google hasn't verified the account's email
  'not_configured', // the API has no Google settings (development without them)
] as const;
export type SignInError = (typeof SIGN_IN_ERRORS)[number];

/**
 * True for a path on our own site, like "/applications/123?tab=notes". "Where to go
 * after signing in" arrives in a URL anyone can craft: without this check, a link
 * could sign you in for real and then send you to a look-alike site (an open redirect).
 */
export function isSafeReturnTo(value: string): boolean {
  // One "/" then anything else is a path on the current site (the URL standard's
  // "path-absolute" form). The traps: "//evil.com" means "https://evil.com", and
  // browsers read "\" as "/" and skip tabs and newlines, so "/\evil.com" and
  // "/\t/evil.com" mean it too.
  // eslint-disable-next-line no-control-regex -- control characters are what we're looking for
  const browserRewrites = /[\\\u0000-\u001f\u007f]/;
  return (
    value.length <= 2000 &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !browserRewrites.test(value)
  );
}
