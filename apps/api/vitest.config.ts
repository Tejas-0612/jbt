import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

// Tests read settings (e.g. TEST_DATABASE_URL) from the repo-root .env.
// In CI there is no .env file; the workflow sets the variables instead.
const ROOT_ENV_FILE = new URL('../../.env', import.meta.url);
const rootEnv = existsSync(ROOT_ENV_FILE)
  ? (parseEnv(readFileSync(ROOT_ENV_FILE, 'utf8')) as Record<string, string>)
  : {};

export default defineConfig({
  test: {
    env: rootEnv,
  },
});
