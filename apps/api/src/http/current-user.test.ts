import { apiErrorBodySchema, meSchema } from '@jbt/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { buildApp } from '../app';
import { createDb } from '../db/client';
import { testConfig } from '../test/config';
import { resetDb } from '../test/db';
import { signedInUser } from '../test/sign-in';
import { cookieNames } from './cookies';

// Integration tests: they need Docker running (`pnpm docker:up`).
const config = testConfig();
const db = createDb(config.DATABASE_URL);
const app = buildApp({ config, db });
afterAll(() => app.close());

beforeEach(() => resetDb(db));
afterEach(() => {
  vi.useRealTimers();
});

const SESSION = cookieNames(config).session;
const DAY_MS = 24 * 60 * 60 * 1000;

const me = (headers: Record<string, string> = {}) =>
  app.inject({ method: 'GET', url: '/api/v1/me', headers });
const sessionCookieIn = (response: Awaited<ReturnType<typeof me>>) =>
  response.cookies.find((cookie) => cookie.name === SESSION);

describe('the signed-in user, on every /api/v1 request', () => {
  it('is the user behind the session cookie (GET /me)', async () => {
    const a = await signedInUser(db, config, 'a');

    const response = await me(a.headers);

    expect(response.statusCode).toBe(200);
    expect(z.object({ data: meSchema }).parse(response.json()).data).toEqual({
      id: a.user.id,
      email: 'user-a@example.com',
      name: 'Sample User A',
      timezone: 'Asia/Kolkata',
    });
  });

  it('is nobody without a session cookie: 401', async () => {
    await signedInUser(db, config, 'a');

    const response = await me();

    expect(response.statusCode).toBe(401);
    expect(apiErrorBodySchema.parse(response.json()).error.code).toBe('UNAUTHORIZED');
  });

  it('is nobody with a made-up token, and the browser is told to drop the cookie', async () => {
    const response = await me({ cookie: `${SESSION}=made-up-token` });

    expect(response.statusCode).toBe(401);
    expect(sessionCookieIn(response)?.value).toBe('');
  });

  it('is nobody once the session has gone unused for 30 days', async () => {
    const start = new Date('2026-10-01T09:00:00Z');
    vi.useFakeTimers({ now: start, toFake: ['Date'] });
    const a = await signedInUser(db, config, 'a');

    vi.setSystemTime(start.getTime() + 30 * DAY_MS);

    expect((await me(a.headers)).statusCode).toBe(401);
  });

  it("moves the cookie's expiry forward when the session is renewed, and only then", async () => {
    const start = new Date('2026-10-01T09:00:00Z');
    vi.useFakeTimers({ now: start, toFake: ['Date'] });
    const a = await signedInUser(db, config, 'a');

    // Same day: nothing to renew, so no Set-Cookie.
    expect(sessionCookieIn(await me(a.headers))).toBeUndefined();

    vi.setSystemTime(start.getTime() + 2 * DAY_MS);
    const cookie = sessionCookieIn(await me(a.headers));

    expect(cookie).toMatchObject({ value: a.token, httpOnly: true, sameSite: 'Lax', path: '/' });
    expect(cookie?.expires).toEqual(new Date(start.getTime() + 32 * DAY_MS));
  });
});
