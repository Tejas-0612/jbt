import {
  apiErrorBody,
  devLoginInputSchema,
  isSafeReturnTo,
  type SignInError,
  type ValidationErrorDetails,
} from '@jbt/shared';
import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Config } from '../../config/env';
import type { Db } from '../../db/client';
import { SAMPLE_USERS } from '../../db/sample-users';
import {
  clearSessionCookie,
  cookieNames,
  cookieOptions,
  setSessionCookie,
} from '../../http/cookies';
import { isValidTimeZone } from '../../lib/dates';
import { revokeSession } from '../sessions/sessions.service';
import { signIn, type SignInIdentity } from './auth.service';
import { GOOGLE_CALLBACK_PATH, type GoogleSignIn } from './google';

interface AuthRoutesOptions {
  config: Config;
  db: Db;
  /** null when the Google settings are missing (development without them). */
  google: GoogleSignIn | null;
}

/** A Google sign-in has 10 minutes to come back. */
const SIGN_IN_COOKIE_MAX_AGE_S = 10 * 60;

/** What waits in the sign-in cookie while the user is on Google's page. */
const signInAttemptSchema = z.object({
  state: z.string(),
  nonce: z.string(),
  codeVerifier: z.string(),
  returnTo: z.string(),
  timezone: z.string(),
});

type Query = Record<string, unknown>;

/**
 * Signing in and out. Registered at /api/v1/auth, outside the signed-in scope (you
 * can't need a session to get one), but inside the Origin check (see app.ts).
 */
export const authRoutes: FastifyPluginCallback<AuthRoutesOptions> = (
  app,
  { config, db, google },
  done,
) => {
  const cookies = cookieNames(config);

  /** Signs the user in, replacing any session this browser already had. */
  async function startSession(
    request: FastifyRequest,
    reply: FastifyReply,
    identity: SignInIdentity,
    timezone: string,
  ): Promise<void> {
    // Signing in again in the same browser: end the old session instead of leaving
    // it unused for 30 days.
    const oldToken = request.cookies[cookies.session];
    if (oldToken) await revokeSession(db, oldToken);

    const session = await signIn(db, identity, timezone);
    setSessionCookie(reply, config, session.token, session.expiresAt);
    request.log.info({ userId: session.userId }, 'signed in');
  }

  // Step 1, the "Continue with Google" link: /auth/google?returnTo=<page>&timezone=<the browser's>.
  app.get<{ Querystring: Query }>('/google', async (request, reply) => {
    if (!google) return reply.redirect(signInFailed('not_configured'));

    let start: Awaited<ReturnType<GoogleSignIn['start']>>;
    try {
      start = await google.start();
    } catch (error) {
      request.log.warn({ reason: reasonOf(error) }, 'could not start a Google sign-in');
      return reply.redirect(signInFailed('failed'));
    }

    const returnTo = text(request.query['returnTo']);
    const timezone = text(request.query['timezone']);
    const attempt = {
      ...start.checks,
      returnTo: returnTo !== undefined && isSafeReturnTo(returnTo) ? returnTo : '/',
      timezone: timezone !== undefined && isValidTimeZone(timezone) ? timezone : 'UTC',
    } satisfies z.infer<typeof signInAttemptSchema>;
    void reply.setCookie(cookies.signIn, JSON.stringify(attempt), {
      ...cookieOptions(config),
      maxAge: SIGN_IN_COOKIE_MAX_AGE_S,
    });
    return reply.redirect(start.url.href);
  });

  // Step 2: Google sends the browser back with ?code=…&state=…, or ?error=… on Cancel.
  app.get<{ Querystring: Query }>('/google/callback', async (request, reply) => {
    // Single use: whatever happens next, this attempt is over.
    const attempt = readSignInAttempt(request.cookies[cookies.signIn]);
    void reply.clearCookie(cookies.signIn, cookieOptions(config));

    if (request.query['error'] === 'access_denied')
      return reply.redirect(signInFailed('cancelled'));
    // No attempt (over 10 minutes, or another browser), or one with a different state:
    // this answer doesn't belong to a sign-in this browser started. That is also what
    // a login-CSRF attack looks like (someone else's answer, to sign you in as them).
    if (!attempt || text(request.query['state']) !== attempt.state) {
      return reply.redirect(signInFailed('expired'));
    }
    if (!google) return reply.redirect(signInFailed('not_configured'));

    // The URL Google sent the browser to: our registered callback plus Google's query.
    const callbackUrl = new URL(GOOGLE_CALLBACK_PATH, config.WEB_ORIGIN);
    callbackUrl.search = new URL(request.url, config.WEB_ORIGIN).search;

    let identity: Awaited<ReturnType<GoogleSignIn['finish']>>;
    try {
      identity = await google.finish(callbackUrl, attempt);
    } catch (error) {
      request.log.warn({ reason: reasonOf(error) }, 'Google sign-in failed');
      return reply.redirect(signInFailed('failed'));
    }
    if (!identity.emailVerified) return reply.redirect(signInFailed('unverified_email'));

    await startSession(request, reply, identity, attempt.timezone);
    return reply.redirect(attempt.returnTo);
  });

  app.post('/logout', async (request, reply) => {
    const token = request.cookies[cookies.session];
    if (token) await revokeSession(db, token);
    clearSessionCookie(reply, config);
    return reply.code(204).send();
  });

  // Development and tests only: sign in as a sample user, no Google needed. In
  // production this route doesn't exist at all (404).
  if (config.NODE_ENV !== 'production') {
    app.post('/dev-login', async (request, reply) => {
      const input = devLoginInputSchema.safeParse(request.body);
      if (!input.success) {
        const details = z.flattenError(input.error) satisfies ValidationErrorDetails;
        return reply
          .code(400)
          .send(apiErrorBody('VALIDATION_ERROR', 'Choose sample user "a" or "b".', details));
      }

      const { timezone, ...identity } = SAMPLE_USERS[input.data.user];
      await startSession(request, reply, identity, timezone);
      return reply.code(204).send();
    });
  }

  done();
};

function signInFailed(error: SignInError): string {
  return `/login?error=${error}`;
}

/** The sign-in cookie's contents, or null if it is missing or not ours. */
function readSignInAttempt(cookie: string | undefined) {
  if (!cookie) return null;
  try {
    const attempt = signInAttemptSchema.safeParse(JSON.parse(cookie));
    return attempt.success ? attempt.data : null;
  } catch {
    return null; // not JSON
  }
}

/** A query value given once. Twice (?state=a&state=b) arrives as a list: not accepted. */
function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Enough to understand a failure in the logs, without tokens or personal data. */
function reasonOf(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error';
}
