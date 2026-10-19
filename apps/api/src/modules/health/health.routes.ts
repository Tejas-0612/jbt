import type { FastifyPluginCallback } from 'fastify';
import { describeDbError, pingDatabase, type Db } from '../../db/client';

interface HealthRoutesOptions {
  db: Pick<Db, '$queryRaw'>;
}

/**
 * Checks for hosting platforms and uptime monitors. They live outside /api/v1
 * because they aren't part of the product API.
 */
export const healthRoutes: FastifyPluginCallback<HealthRoutesOptions> = (app, { db }, done) => {
  // Liveness: "is the process up?". Never touches the database, so a database
  // outage doesn't make the host think the API itself is broken and restart it.
  app.get('/health', () => ({ data: { status: 'ok' } }));

  // Readiness: "can it serve real requests right now?". Needs the database.
  app.get('/ready', async (request, reply) => {
    try {
      await pingDatabase(db);
      return { data: { status: 'ready' } };
    } catch (error) {
      // A short reason, not the stack trace: monitors poll /ready every few seconds.
      request.log.warn({ reason: describeDbError(error) }, 'not ready: database unreachable');
      return reply.code(503).send({
        error: { code: 'NOT_READY', message: 'The database is unreachable' },
      });
    }
  });

  done();
};
