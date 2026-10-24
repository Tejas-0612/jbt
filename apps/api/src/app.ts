import { randomUUID } from 'node:crypto';
import fastifyCookie from '@fastify/cookie';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { Config } from './config/env';
import type { Db } from './db/client';
import { registerCurrentUser } from './http/current-user';
import { registerErrorHandlers } from './http/errors';
import { registerOriginCheck } from './http/origin-check';
import { applicationRoutes } from './modules/applications/applications.routes';
import { authRoutes } from './modules/auth/auth.routes';
import type { GoogleSignIn } from './modules/auth/google';
import { healthRoutes } from './modules/health/health.routes';
import { userRoutes } from './modules/users/users.routes';

function loggerOptions(config: Config): FastifyServerOptions['logger'] {
  return {
    level: config.LOG_LEVEL,
    // Never write credentials to logs, even if someone logs request headers later.
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      censor: '[redacted]',
    },
    // Development: readable, coloured lines. Everywhere else: JSON for log tools.
    ...(config.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
        // SYS: = your computer's local time (the default is UTC).
        options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      },
    }),
  };
}

/** Everything the API needs from outside. Tests can pass fakes (e.g. an unreachable db). */
export interface AppDependencies {
  config: Config;
  db: Db;
  /** Google sign-in. Left out or null: not set up (server.ts makes it when configured). */
  google?: GoogleSignIn | null;
}

/**
 * Creates the API without starting it. Tests call this and send fake requests
 * with app.inject(); server.ts calls it and then listens on a real port.
 */
export function buildApp({ config, db, google = null }: AppDependencies): FastifyInstance {
  const app = Fastify({
    logger: loggerOptions(config),
    // Every request gets a unique ID, shown in every log line it produces.
    genReqId: () => randomUUID(),
  });

  // Return the ID to the caller, so a user's problem can be found in the logs.
  app.addHook('onRequest', (request, reply, done) => {
    void reply.header('x-request-id', request.id);
    done();
  });

  // app.close() (shutdown, end of tests) also closes the database connections.
  app.addHook('onClose', async () => {
    await db.$disconnect();
  });

  registerErrorHandlers(app);
  // Reads the Cookie header into request.cookies; adds reply.setCookie / clearCookie.
  void app.register(fastifyCookie);

  void app.register(healthRoutes, { db });

  // The product API. Fastify keeps a hook inside the scope it was added in (and the
  // scopes nested in it), so:
  //   /api/v1          Origin check on every POST/PATCH/DELETE (CSRF)
  //   ├── /auth        signing in and out: no session needed
  //   └── everything   needs a signed-in user, or answers 401
  void app.register(
    (api, _options, done) => {
      registerOriginCheck(api, config);
      void api.register(authRoutes, { prefix: '/auth', config, db, google });
      void api.register((signedIn, _signedInOptions, signedInDone) => {
        registerCurrentUser(signedIn, { config, db });
        void signedIn.register(userRoutes, { db });
        void signedIn.register(applicationRoutes, { db });
        signedInDone();
      });
      done();
    },
    { prefix: '/api/v1' },
  );

  return app;
}
