// Settings for the Prisma CLI (generate, migrate, studio).
// Prisma 7.10+ names this file prisma7.config.ts so it can't clash with Prisma 8.
import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// The CLI doesn't read .env by itself. In development we load the repo-root .env
// (scripts run from apps/api); in production the platform sets DATABASE_URL directly.
const ROOT_ENV_FILE = '../../.env';
if (existsSync(ROOT_ENV_FILE)) process.loadEnvFile(ROOT_ENV_FILE);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
