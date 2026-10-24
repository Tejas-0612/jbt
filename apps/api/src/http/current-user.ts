import { apiErrorBody } from '@jbt/shared';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { User } from '../../generated/prisma/client';
import type { Config } from '../config/env';
import type { Db } from '../db/client';
import { findValidSession } from '../modules/sessions/sessions.service';
import { clearSessionCookie, cookieNames, setSessionCookie } from './cookies';

/** What the rest of the API needs to know about the signed-in user. */
export type CurrentUser = Pick<User, 'id' | 'timezone'>;

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the hook below on every signed-in request; null elsewhere. */
    currentUser: CurrentUser | null;
  }
}

/**
 * Finds the signed-in user from the session cookie, for every route registered in the
 * same scope (everything under /api/v1 except /api/v1/auth, see app.ts). No cookie,
 * or a session that is unknown, expired or signed out: 401, and the route never runs.
 */
export function registerCurrentUser(app: FastifyInstance, deps: { config: Config; db: Db }): void {
  const { config, db } = deps;
  const sessionCookie = cookieNames(config).session;
  app.decorateRequest('currentUser', null);

  app.addHook('onRequest', async (request, reply) => {
    const token = request.cookies[sessionCookie];
    if (!token) return reply.code(401).send(notSignedIn());

    const session = await findValidSession(db, token);
    if (!session) {
      // The cookie points at a dead session: tell the browser to drop it.
      clearSessionCookie(reply, config);
      return reply.code(401).send(notSignedIn());
    }

    // The session's expiry moved forward (at most once a day): move the cookie's too.
    if (session.renewed) setSessionCookie(reply, config, token, session.expiresAt);
    request.currentUser = session.user;
  });
}

/** The signed-in user, for routes registered under the hook above. */
export function requireCurrentUser(request: FastifyRequest): CurrentUser {
  // Only a wiring mistake (a route outside the signed-in scope) gets here: a bug, so a 500.
  if (!request.currentUser) throw new Error('No current user: route outside the signed-in scope?');
  return request.currentUser;
}

function notSignedIn() {
  return apiErrorBody('UNAUTHORIZED', 'You are not signed in.');
}
