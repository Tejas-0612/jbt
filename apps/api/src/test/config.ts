import { loadConfig, type Config } from '../config/env';

/**
 * Settings for tests: quiet logs and the separate jbt_test database,
 * so tests never touch development data.
 */
export function testConfig(): Config {
  const databaseUrl = process.env['TEST_DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is not set. Copy .env.example to .env in the repo root.');
  }
  return loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent', DATABASE_URL: databaseUrl });
}
