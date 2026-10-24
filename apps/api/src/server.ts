import { buildApp } from './app';
import { loadConfig, type Config } from './config/env';
import { createDb, describeDbError, pingDatabase } from './db/client';
import { GOOGLE_CALLBACK_PATH, createGoogleSignIn } from './modules/auth/google';

function readConfigOrExit(): Config {
  try {
    return loadConfig();
  } catch (error) {
    // The logger doesn't exist yet, so print the problem plainly and stop.
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const config = readConfigOrExit();
const db = createDb(config.DATABASE_URL);
// Without Google settings (allowed outside production), the dev login still works.
const google =
  config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET
    ? createGoogleSignIn({
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        redirectUri: new URL(GOOGLE_CALLBACK_PATH, config.WEB_ORIGIN).href,
      })
    : null;
const app = buildApp({ config, db, google });

// Ctrl+C (SIGINT) or the host stopping us (SIGTERM): stop taking new requests,
// let the ones in progress finish, close database connections, then exit.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, 'shutting down');
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error({ err: error }, 'shutdown failed');
        process.exit(1);
      },
    );
  });
}

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.fatal({ err: error }, 'could not start the server');
  process.exit(1);
}

if (!google) {
  app.log.info('Google sign-in is not set up (README: "Sign in with Google"); the dev login works');
}

// Not fatal: the API keeps running without the database and /ready reports it.
// This only saves you from wondering why requests fail.
pingDatabase(db).then(
  () => app.log.info('database reachable'),
  (error: unknown) => {
    app.log.warn(
      { reason: describeDbError(error) },
      'database not reachable yet. Is Docker running? (pnpm docker:up)',
    );
  },
);
