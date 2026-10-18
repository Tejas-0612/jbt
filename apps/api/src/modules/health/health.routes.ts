import type { FastifyPluginCallback } from 'fastify';

/**
 * Liveness check for hosting platforms and uptime monitors: "is the process up?".
 * Lives outside /api/v1 because it isn't part of the product API.
 */
export const healthRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get('/health', () => ({ data: { status: 'ok' } }));
  done();
};
