import { http, HttpResponse } from 'msw';
import { sampleMe } from './fixtures';

/**
 * Default fake API answers: everything healthy. A test that needs a different
 * situation (database down, broken answer…) overrides one with `server.use(...)`.
 * The override is removed again after each test (see setup.ts).
 */
export const handlers = [
  http.get('/health', () => HttpResponse.json({ data: { status: 'ok' } })),
  http.get('/ready', () => HttpResponse.json({ data: { status: 'ready' } })),
  // Signed in as Sample User A.
  http.get('/api/v1/me', () => HttpResponse.json({ data: sampleMe() })),
];
