import { buildApp } from './app';
import { loadConfig, type Config } from './config/env';

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
const app = buildApp(config);

// Ctrl+C (SIGINT) or the host stopping us (SIGTERM): stop taking new requests,
// let the ones in progress finish, then exit.
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
