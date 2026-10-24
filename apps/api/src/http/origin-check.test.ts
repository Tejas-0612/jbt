import { apiErrorBodySchema } from '@jbt/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { createDb } from '../db/client';
import { testConfig } from '../test/config';
import { resetDb } from '../test/db';
import { signedInUser } from '../test/sign-in';

// Integration tests: they need Docker running (`pnpm docker:up`).
const config = testConfig();
const db = createDb(config.DATABASE_URL);
const app = buildApp({ config, db });
afterAll(() => app.close());

beforeEach(() => resetDb(db));

const application = { companyName: 'Acme Corp', roleTitle: 'Engineer', status: 'SAVED' };

describe('requests that change something must come from the app (CSRF)', () => {
  it('blocks a POST from another site, even with a valid session cookie, and saves nothing', async () => {
    const a = await signedInUser(db, config, 'a');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/applications',
      payload: application,
      headers: { cookie: a.headers.cookie, origin: 'https://evil.example' },
    });

    expect(response.statusCode).toBe(403);
    expect(apiErrorBodySchema.parse(response.json()).error.code).toBe('FORBIDDEN');
    expect(await db.application.count()).toBe(0);
  });

  it('blocks a POST with no Origin at all', async () => {
    const a = await signedInUser(db, config, 'a');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/applications',
      payload: application,
      headers: { cookie: a.headers.cookie },
    });

    expect(response.statusCode).toBe(403);
  });

  it('also guards signing in and out', async () => {
    const a = await signedInUser(db, config, 'a');
    const evil = { cookie: a.headers.cookie, origin: 'https://evil.example' };

    const logout = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: evil });
    const devLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/dev-login',
      payload: { user: 'b' },
      headers: evil,
    });

    expect([logout.statusCode, devLogin.statusCode]).toEqual([403, 403]);
    // Still signed in as A.
    expect(
      (await app.inject({ method: 'GET', url: '/api/v1/me', headers: a.headers })).statusCode,
    ).toBe(200);
  });

  it('lets reads through without an Origin', async () => {
    const a = await signedInUser(db, config, 'a');

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie: a.headers.cookie },
    });

    expect(response.statusCode).toBe(200);
  });

  it("lets the app's own requests through", async () => {
    const a = await signedInUser(db, config, 'a');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/applications',
      payload: { ...application, appliedOn: null },
      headers: a.headers,
    });

    expect(response.statusCode).toBe(201);
  });
});
