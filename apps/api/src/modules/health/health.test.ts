import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app';
import { createDb, type Db } from '../../db/client';
import { testConfig } from '../../test/config';

describe('GET /ready with the real test database', () => {
  const config = testConfig();
  const app = buildApp({ config, db: createDb(config.DATABASE_URL) });
  afterAll(() => app.close());

  // Integration test: needs Docker running (`pnpm docker:up`).
  it('reports ready when Postgres answers', async () => {
    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { status: 'ready' } });
  });
});

describe('when the database is unreachable', () => {
  // A fake database that fails like a stopped Postgres does.
  const unreachableDb = {
    $queryRaw: () => Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:5433')),
    $disconnect: () => Promise.resolve(),
  } as unknown as Db;

  const app = buildApp({ config: testConfig(), db: unreachableDb });
  afterAll(() => app.close());

  it('GET /ready answers 503 NOT_READY', async () => {
    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: { code: 'NOT_READY', message: 'The database is unreachable' },
    });
  });

  it('GET /health still answers 200, so the host does not restart the API', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
  });
});
