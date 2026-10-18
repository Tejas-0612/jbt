import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { loadConfig } from './config/env';

const testConfig = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('API basics', () => {
  const app = buildApp(testConfig);
  afterAll(() => app.close());

  it('GET /health reports that the API is up', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { status: 'ok' } });
  });

  it('gives every response its own request ID', async () => {
    const first = await app.inject({ method: 'GET', url: '/health' });
    const second = await app.inject({ method: 'GET', url: '/health' });

    expect(first.headers['x-request-id']).toMatch(UUID);
    expect(second.headers['x-request-id']).not.toBe(first.headers['x-request-id']);
  });

  it('answers unknown routes with 404 in the standard error format', async () => {
    const response = await app.inject({ method: 'GET', url: '/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /nope not found' },
    });
  });
});

describe('unexpected errors', () => {
  const app = buildApp(testConfig);
  app.get('/boom', () => {
    throw new Error('database password is hunter2');
  });
  afterAll(() => app.close());

  it('return 500 without leaking internal details', async () => {
    const response = await app.inject({ method: 'GET', url: '/boom' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
    });
    expect(response.body).not.toContain('hunter2');
  });
});
