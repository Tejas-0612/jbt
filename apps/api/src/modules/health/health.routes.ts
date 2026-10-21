import { apiErrorBody, type HealthResponse, type ReadyResponse } from '@jbt/shared';
import type { FastifyPluginCallback } from 'fastify';
import { describeDbError, pingDatabase, type Db } from '../../db/client';

interface HealthRoutesOptions {
  db: Pick<Db, '$queryRaw'>;
}

/**
 * Checks for hosting platforms and uptime monitors. They live outside /api/v1
 * because they aren't part of the product API.
 *
 * `satisfies` checks each answer against the shared type, so if the shared shape
 * changes, this file stops compiling instead of silently sending the old shape.
 */
export const healthRoutes: FastifyPluginCallback<HealthRoutesOptions> = (app, { db }, done) => {
  // Liveness: "is the process up?". Never touches the database, so a database
  // outage doesn't make the host think the API itself is broken and restart it.
  app.get('/health', () => ({ data: { status: 'ok' } }) satisfies { data: HealthResponse });

  // Readiness: "can it serve real requests right now?". Needs the database.
  app.get('/ready', async (request, reply) => {
    try {
      await pingDatabase(db);
      return { data: { status: 'ready' } } satisfies { data: ReadyResponse };
    } catch (error) {
      // A short reason, not the stack trace: monitors poll /ready every few seconds.
      request.log.warn({ reason: describeDbError(error) }, 'not ready: database unreachable');
      return reply.code(503).send(apiErrorBody('NOT_READY', 'The database is unreachable'));
    }
  });

  done();
};
