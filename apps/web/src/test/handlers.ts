import { http, HttpResponse } from 'msw';

/**
 * Default fake API answers: everything healthy. A test that needs a different
 * situation (database down, broken answer…) overrides one with `server.use(...)`.
 * The override is removed again after each test (see setup.ts).
 */
export const handlers = [
  http.get('/health', () => HttpResponse.json({ data: { status: 'ok' } })),
  http.get('/ready', () => HttpResponse.json({ data: { status: 'ready' } })),
];
