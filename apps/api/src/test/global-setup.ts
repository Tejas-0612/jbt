import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { TestProject } from 'vitest/node';

const API_DIR = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Runs once before all API tests (see vitest.config.ts): brings the test database
 * (jbt_test) up to date with the committed migrations. `migrate deploy` only applies
 * missing migrations; it never creates new ones or asks questions, so it also works in CI.
 */
export default function setup(project: TestProject): void {
  // `test.env` from vitest.config.ts reaches the test files, but not this setup,
  // which runs earlier in Vitest's main process. Read it from the resolved config.
  const testDatabaseUrl =
    project.config.env['TEST_DATABASE_URL'] ?? process.env['TEST_DATABASE_URL'];
  if (!testDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL is not set. Copy .env.example to .env in the repo root.');
  }

  // Prisma's CLI is a plain Node script, so run it with this Node directly
  // (no shell, which behaves differently on Windows).
  const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');
  try {
    execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
      cwd: API_DIR,
      // prisma7.config.ts reads DATABASE_URL. A variable that is already set wins
      // over the .env file, so this points Prisma at the test database.
      env: { ...process.env, DATABASE_URL: testDatabaseUrl, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
      stdio: 'pipe',
    });
  } catch (error) {
    throw new Error(
      `Could not apply migrations to the test database. Is Docker running (pnpm docker:up)?\n${commandOutput(error)}`,
      { cause: error },
    );
  }
}

/** What a failed command printed, so the reason shows up in the test output. */
function commandOutput(error: unknown): string {
  if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
    return `${String(error.stdout)}${String(error.stderr)}`.trim();
  }
  return String(error);
}
