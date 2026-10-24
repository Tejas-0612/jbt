// Runs before every test file (see vitest.config.ts).
import '@testing-library/jest-dom/vitest'; // adds expect(...).toBeInTheDocument() and friends
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// A request with no fake answer fails the test loudly, instead of silently
// going nowhere. (MSW 3 calls this onUnhandledFrame; it was onUnhandledRequest.)
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

// jsdom draws nothing, so it has no scrolling and prints "Not implemented" whenever
// the app's ScrollRestoration scrolls. Nothing to test there: do nothing instead.
window.scrollTo = () => {};

// Every test starts fresh: remove rendered components and per-test overrides.
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
