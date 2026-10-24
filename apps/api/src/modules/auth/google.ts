import * as oidc from 'openid-client';
import { z } from 'zod';

/** Where Google sends the browser back to. Must match the URI registered in Google Cloud Console. */
export const GOOGLE_CALLBACK_PATH = '/api/v1/auth/google/callback';

/** Who Google says the user is. */
export interface GoogleIdentity {
  /** Google's permanent id for the account. */
  googleSub: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

/**
 * One-time values made when a sign-in starts. Google's answer must match them; they
 * wait in a cookie in between (see auth.routes.ts).
 * - state: proves the answer belongs to a sign-in this browser started (login CSRF).
 * - nonce: the same, for the ID token inside the answer (a replayed token fails).
 * - codeVerifier (PKCE): only we can swap Google's one-time code for tokens, even if
 *   someone else gets hold of the code.
 */
export interface GoogleSignInChecks {
  state: string;
  nonce: string;
  codeVerifier: string;
}

/**
 * Signing in with Google, as the rest of the API sees it. The real one below talks to
 * Google; tests pass a fake, so they need no Google account and no network.
 */
export interface GoogleSignIn {
  /** Where to send the browser, and the checks its answer must pass. */
  start(): Promise<{ url: URL; checks: GoogleSignInChecks }>;
  /** Google's answer (the full callback URL) → who signed in. Throws if any check fails. */
  finish(callbackUrl: URL, checks: GoogleSignInChecks): Promise<GoogleIdentity>;
}

// The ID token's claims we use. openid-client has already checked its signature,
// issuer, audience (our client id), expiry and nonce by the time we read them.
const claimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().min(1),
  email_verified: z.boolean(),
  name: z.string().min(1).optional(),
});

/**
 * The real Google sign-in: OAuth's "authorization code" flow with PKCE, through
 * openid-client. Checked by hand with a real Google account (README).
 */
export function createGoogleSignIn(options: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): GoogleSignIn {
  // Google's settings (endpoints, signing keys) are fetched on the first sign-in, not at
  // startup, so the API starts even when Google can't be reached. A failed fetch is
  // forgotten, so the next sign-in tries again.
  let configuration: Promise<oidc.Configuration> | undefined;
  const googleConfiguration = () => {
    configuration ??= oidc
      .discovery(new URL('https://accounts.google.com'), options.clientId, options.clientSecret)
      .catch((error: unknown) => {
        configuration = undefined;
        throw error;
      });
    return configuration;
  };

  return {
    async start() {
      const checks = {
        state: oidc.randomState(),
        nonce: oidc.randomNonce(),
        codeVerifier: oidc.randomPKCECodeVerifier(),
      };
      const url = oidc.buildAuthorizationUrl(await googleConfiguration(), {
        redirect_uri: options.redirectUri,
        // Who you are, and nothing else: no Gmail, no Calendar.
        scope: 'openid email profile',
        state: checks.state,
        nonce: checks.nonce,
        code_challenge: await oidc.calculatePKCECodeChallenge(checks.codeVerifier),
        code_challenge_method: 'S256',
        // Always show Google's account chooser, for people with more than one account.
        prompt: 'select_account',
      });
      return { url, checks };
    },

    async finish(callbackUrl, checks) {
      const tokens = await oidc.authorizationCodeGrant(await googleConfiguration(), callbackUrl, {
        expectedState: checks.state,
        expectedNonce: checks.nonce,
        pkceCodeVerifier: checks.codeVerifier,
      });
      // Knowing who signed in is all we need. Google's access token is dropped here:
      // we never call Google on the user's behalf.
      const claims = claimsSchema.parse(tokens.claims());
      return {
        googleSub: claims.sub,
        email: claims.email,
        emailVerified: claims.email_verified,
        name: claims.name ?? claims.email,
      };
    },
  };
}
