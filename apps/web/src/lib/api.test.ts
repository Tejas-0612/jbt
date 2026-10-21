import { apiErrorBody, healthResponseSchema } from '@jbt/shared';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { ApiError, getJson } from './api';

describe('getJson', () => {
  it('returns the data part of a correct answer', async () => {
    await expect(getJson('/health', healthResponseSchema)).resolves.toEqual({ status: 'ok' });
  });

  it('passes on the API’s own error code and message', async () => {
    server.use(
      http.get('/health', () =>
        HttpResponse.json(apiErrorBody('NOT_FOUND', 'Nothing here'), { status: 404 }),
      ),
    );

    const failure = getJson('/health', healthResponseSchema);
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Nothing here',
    });
  });

  it('reports API_UNREACHABLE when the answer isn’t the API’s JSON (e.g. proxy error)', async () => {
    server.use(http.get('/health', () => new HttpResponse('Bad Gateway', { status: 502 })));

    await expect(getJson('/health', healthResponseSchema)).rejects.toMatchObject({
      status: 502,
      code: 'API_UNREACHABLE',
    });
  });

  it('reports NETWORK_ERROR when there is no connection at all', async () => {
    server.use(http.get('/health', () => HttpResponse.error()));

    await expect(getJson('/health', healthResponseSchema)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  // The runtime check from step 7: the API and web app disagree about a shape.
  it('reports INVALID_RESPONSE when the data has the wrong shape', async () => {
    server.use(http.get('/health', () => HttpResponse.json({ data: { status: 'up' } })));

    await expect(getJson('/health', healthResponseSchema)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('reports INVALID_RESPONSE when the { data } wrapper is missing', async () => {
    server.use(http.get('/health', () => HttpResponse.json({ status: 'ok' })));

    await expect(getJson('/health', healthResponseSchema)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
});
