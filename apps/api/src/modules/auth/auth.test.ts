import { meSchema } from '@jbt/shared';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { buildApp } from '../../app';
import type { Config } from '../../config/env';
import { createDb } from '../../db/client';
import { cookieNames } from '../../http/cookies';
import { testConfig } from '../../test/config';
import { resetDb } from '../../test/db';
import { signedInUser } from '../../test/sign-in';
import { findValidSession } from '../sessions/sessions.service';
import type { GoogleIdentity, GoogleSignIn } from './google';

// Integration tests: real routes and test database (`pnpm docker:up`), fake Google.
const config = testConfig();
const db = createDb(config.DATABASE_URL);
afterAll(() => db.$disconnect());

const CHECKS = { state: 'state-123', nonce: 'nonce-123', codeVerifier: 'verifier-123' };
const GOOGLE_PAGE = 'https://accounts.google.example/o/oauth2/auth?state=state-123';
const TEJAS: GoogleIdentity = {
  googleSub: 'google-sub-1',
  email: 'tejas@example.com',
  emailVerified: true,
  name: 'Tejas',
};

/** Stands in for Google: start() and finish() succeed unless a test says otherwise. */
function fakeGoogle() {
  return {
    start: vi.fn<GoogleSignIn['start']>(() =>
      Promise.resolve({ url: new URL(GOOGLE_PAGE), checks: CHECKS }),
    ),
    finish: vi.fn<GoogleSignIn['finish']>(() => Promise.resolve(TEJAS)),
  };
}

let google: ReturnType<typeof fakeGoogle>;
let app: FastifyInstance;
const extraApps: FastifyInstance[] = [];

/** Another app (e.g. production settings). Its own db, because app.close() disconnects it. */
function anotherApp(overrides: Partial<Config>, withGoogle: GoogleSignIn | null = google) {
  const another = buildApp({
    config: { ...config, ...overrides },
    db: createDb(config.DATABASE_URL),
    google: withGoogle,
  });
  extraApps.push(another);
  return another;
}

beforeEach(async () => {
  await resetDb(db);
  google = fakeGoogle();
  app = buildApp({ config, db: createDb(config.DATABASE_URL), google });
});
afterEach(async () => {
  await Promise.all([app, ...extraApps.splice(0)].map((each) => each.close()));
});

const names = cookieNames(config);
const cookieIn = (response: LightMyRequestResponse, name: string) =>
  response.cookies.find((cookie) => cookie.name === name);
/** The Cookie header a browser would send back (values stay URL-encoded, as set). */
const cookieHeader = (...cookies: ({ name: string; value: string } | undefined)[]) =>
  cookies
    .flatMap((cookie) => (cookie ? [`${cookie.name}=${encodeURIComponent(cookie.value)}`] : []))
    .join('; ');

/** Step 1: the browser follows "Continue with Google". */
async function startSignIn(query = '?returnTo=/applications/abc&timezone=Europe/Berlin') {
  const response = await app.inject({ method: 'GET', url: `/api/v1/auth/google${query}` });
  return { response, signInCookie: cookieIn(response, names.signIn) };
}

/** Step 2: Google sends the browser back to us. */
const callback = (query: string, cookie = '', on: FastifyInstance = app) =>
  on.inject({ method: 'GET', url: `/api/v1/auth/google/callback${query}`, headers: { cookie } });

/** Both steps, as a successful sign-in. */
async function signInWithGoogle(startQuery?: string) {
  const { signInCookie } = await startSignIn(startQuery);
  return callback('?code=abc&state=state-123', cookieHeader(signInCookie));
}

const meWith = async (response: LightMyRequestResponse) => {
  const me = await app.inject({
    method: 'GET',
    url: '/api/v1/me',
    headers: { cookie: cookieHeader(cookieIn(response, names.session)) },
  });
  return z.object({ data: meSchema }).parse(me.json()).data;
};

describe('signing in with Google', () => {
  it('sends the browser to Google, remembering the sign-in in a 10-minute cookie', async () => {
    const { response, signInCookie } = await startSignIn();

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(GOOGLE_PAGE);
    expect(signInCookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 600 });
  });

  it('creates the account on the first sign-in and opens the page the user wanted', async () => {
    const response = await signInWithGoogle();

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/applications/abc');
    expect(cookieIn(response, names.session)).toMatchObject({ httpOnly: true, sameSite: 'Lax' });
    expect(await meWith(response)).toMatchObject({
      email: 'tejas@example.com',
      name: 'Tejas',
      timezone: 'Europe/Berlin', // the browser's
    });
  });

  it("checks Google's answer against the sign-in this browser started", async () => {
    await signInWithGoogle();

    expect(google.finish).toHaveBeenCalledWith(
      new URL('http://localhost:5173/api/v1/auth/google/callback?code=abc&state=state-123'),
      expect.objectContaining(CHECKS),
    );
  });

  it('finds the same account on later sign-ins and refreshes its email and name', async () => {
    await db.user.create({
      data: {
        googleSub: TEJAS.googleSub,
        email: 'old@example.com',
        name: 'T',
        timezone: 'Asia/Kolkata',
      },
    });

    const response = await signInWithGoogle();

    expect(await db.user.count()).toBe(1);
    expect(await meWith(response)).toMatchObject({
      email: 'tejas@example.com',
      name: 'Tejas',
      timezone: 'Asia/Kolkata', // kept: only a new account takes the browser's
    });
  });

  it('uses UTC when the browser sent no valid timezone, and the dashboard by default', async () => {
    const response = await signInWithGoogle('?timezone=Mars/Olympus_Mons');

    expect(response.headers.location).toBe('/');
    expect((await meWith(response)).timezone).toBe('UTC');
  });

  it.each(['https://evil.example', '//evil.example', '/\\evil.example'])(
    'never sends the browser to another site afterwards: %s',
    async (returnTo) => {
      const response = await signInWithGoogle(`?returnTo=${encodeURIComponent(returnTo)}`);

      expect(response.headers.location).toBe('/');
    },
  );

  it("refuses an answer whose state doesn't match the sign-in this browser started", async () => {
    const { signInCookie } = await startSignIn();

    const response = await callback('?code=abc&state=someone-elses', cookieHeader(signInCookie));

    expect(response.headers.location).toBe('/login?error=expired');
    expect(cookieIn(response, names.session)).toBeUndefined();
    expect(google.finish).not.toHaveBeenCalled();
    expect(await db.user.count()).toBe(0);
  });

  it('refuses an answer without the sign-in cookie (over 10 minutes, or another browser)', async () => {
    const response = await callback('?code=abc&state=state-123');

    expect(response.headers.location).toBe('/login?error=expired');
    expect(google.finish).not.toHaveBeenCalled();
  });

  it('uses the sign-in cookie only once', async () => {
    const response = await signInWithGoogle();

    expect(cookieIn(response, names.signIn)?.value).toBe('');
  });

  it('says "cancelled" when the user pressed Cancel at Google', async () => {
    const { signInCookie } = await startSignIn();

    const response = await callback(
      '?error=access_denied&state=state-123',
      cookieHeader(signInCookie),
    );

    expect(response.headers.location).toBe('/login?error=cancelled');
    expect(await db.user.count()).toBe(0);
  });

  it("refuses a Google account whose email isn't verified", async () => {
    google.finish.mockResolvedValueOnce({ ...TEJAS, emailVerified: false });

    const response = await signInWithGoogle();

    expect(response.headers.location).toBe('/login?error=unverified_email');
    expect(await db.user.count()).toBe(0);
  });

  it('says "failed" when Google\'s answer fails a check', async () => {
    google.finish.mockRejectedValueOnce(new Error('unexpected ID Token "nonce" claim value'));

    const response = await signInWithGoogle();

    expect(response.headers.location).toBe('/login?error=failed');
    expect(cookieIn(response, names.session)).toBeUndefined();
    expect(await db.user.count()).toBe(0);
  });

  it('says "failed" when Google can\'t be reached', async () => {
    google.start.mockRejectedValueOnce(new TypeError('fetch failed'));

    const { response } = await startSignIn();

    expect(response.headers.location).toBe('/login?error=failed');
  });

  it("says sign-in isn't set up when the Google settings are missing", async () => {
    const withoutGoogle = anotherApp({}, null);

    const response = await withoutGoogle.inject({ method: 'GET', url: '/api/v1/auth/google' });

    expect(response.headers.location).toBe('/login?error=not_configured');
  });

  it('ends the session this browser already had', async () => {
    const a = await signedInUser(db, config, 'a');
    const { signInCookie } = await startSignIn();

    await callback(
      '?code=abc&state=state-123',
      `${a.headers.cookie}; ${cookieHeader(signInCookie)}`,
    );

    expect(await findValidSession(db, a.token)).toBeNull();
  });

  it('uses Secure "__Host-" cookies in production', async () => {
    const production = anotherApp({ NODE_ENV: 'production', WEB_ORIGIN: 'https://jbt.example' });

    const start = await production.inject({ method: 'GET', url: '/api/v1/auth/google' });
    const signInCookie = cookieIn(start, '__Host-jbt_sign_in');
    const done = await callback(
      '?code=abc&state=state-123',
      cookieHeader(signInCookie),
      production,
    );

    expect(signInCookie).toMatchObject({ secure: true, path: '/' });
    expect(cookieIn(done, '__Host-jbt_session')).toMatchObject({ secure: true, httpOnly: true });
    expect(google.finish.mock.calls[0]?.[0].origin).toBe('https://jbt.example');
  });
});

describe('dev login', () => {
  const devLogin = (payload: object, on: FastifyInstance = app) =>
    on.inject({
      method: 'POST',
      url: '/api/v1/auth/dev-login',
      payload,
      headers: { origin: config.WEB_ORIGIN },
    });

  it('signs in as a sample user, creating them if missing', async () => {
    const response = await devLogin({ user: 'b' });

    expect(response.statusCode).toBe(204);
    expect(await meWith(response)).toMatchObject({
      name: 'Sample User B',
      timezone: 'America/New_York',
    });
  });

  it('accepts only the two sample users', async () => {
    expect((await devLogin({ user: 'c' })).statusCode).toBe(400);
  });

  it('does not exist in production', async () => {
    const production = anotherApp({ NODE_ENV: 'production', WEB_ORIGIN: config.WEB_ORIGIN });

    expect((await devLogin({ user: 'a' }, production)).statusCode).toBe(404);
    expect(await db.user.count()).toBe(0);
  });
});

describe('signing out', () => {
  const logout = (headers: Record<string, string>) =>
    app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers });

  it('ends the session and clears the cookie', async () => {
    const a = await signedInUser(db, config, 'a');

    const response = await logout(a.headers);

    expect(response.statusCode).toBe(204);
    expect(cookieIn(response, names.session)?.value).toBe('');
    const me = await app.inject({ method: 'GET', url: '/api/v1/me', headers: a.headers });
    expect(me.statusCode).toBe(401);
  });

  it('is fine when already signed out', async () => {
    expect((await logout({ origin: config.WEB_ORIGIN })).statusCode).toBe(204);
  });
});
