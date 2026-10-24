import { apiErrorBody } from '@jbt/shared';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../config/env';

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection. A request that changes something (POST, PATCH, PUT, DELETE) must
 * come from our own web app. Browsers add an Origin header to these requests and a
 * page can't fake it, so another site's hidden form posting here with your cookie
 * gets 403 and changes nothing. Requests without an Origin (curl, scripts) are
 * refused too: only browsers hold our cookie, and they always send one.
 *
 * Works together with SameSite=Lax cookies (cookies.ts): either one alone would
 * stop most attacks; both together cover old browsers and same-site tricks.
 */
export function registerOriginCheck(app: FastifyInstance, config: Config): void {
  app.addHook('onRequest', (request, reply, done) => {
    if (READ_ONLY_METHODS.has(request.method) || request.headers.origin === config.WEB_ORIGIN) {
      done();
      return;
    }
    request.log.warn({ origin: request.headers.origin ?? null }, 'blocked: wrong Origin');
    // Answering from a hook ends the request here; done() must not be called as well.
    void reply
      .code(403)
      .send(
        apiErrorBody('FORBIDDEN', 'This request did not come from the app, so it was blocked.'),
      );
  });
}
