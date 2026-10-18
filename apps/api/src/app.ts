import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { Config } from './config/env';
import { registerErrorHandlers } from './http/errors';
import { healthRoutes } from './modules/health/health.routes';

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

/**
 * Creates the API without starting it. Tests call this and send fake requests
 * with app.inject(); server.ts calls it and then listens on a real port.
 */
export function buildApp(config: Config): FastifyInstance {
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

  registerErrorHandlers(app);

  void app.register(healthRoutes);

  return app;
}
