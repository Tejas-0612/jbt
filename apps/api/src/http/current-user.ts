import { apiErrorBody } from '@jbt/shared';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { User } from '../../generated/prisma/client';
import type { Config } from '../config/env';
import type { Db } from '../db/client';
import { SAMPLE_USERS, type SampleUserKey } from '../db/sample-users';

/** What the rest of the API needs to know about the signed-in user. */
export type CurrentUser = Pick<User, 'id' | 'timezone'>;

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the hook below on every /api/v1 request; null elsewhere. */
    currentUser: CurrentUser | null;
  }
}

/**
 * STAND-IN until real sign-in (Google login replaces only this file).
 *
 * Every /api/v1 request is treated as signed in as sample user A from the seed.
 * Tests (and you, with a tool like curl) can act as user B by sending the header
 * `x-dev-user: b`. In production nobody is signed in yet, so every request gets 401.
 */
export function registerCurrentUser(app: FastifyInstance, deps: { config: Config; db: Db }): void {
  const { config, db } = deps;
  app.decorateRequest('currentUser', null);

  app.addHook('onRequest', async (request, reply) => {
    if (config.NODE_ENV === 'production') {
      return reply.code(401).send(apiErrorBody('UNAUTHORIZED', 'Sign-in is not available yet.'));
    }

    const key = sampleUserKey(request.headers['x-dev-user']);
    if (!key) {
      return reply
        .code(401)
        .send(apiErrorBody('UNAUTHORIZED', 'The x-dev-user header must be "a" or "b".'));
    }

    const user = await db.user.findUnique({
      where: { googleSub: SAMPLE_USERS[key].googleSub },
      select: { id: true, timezone: true },
    });
    if (!user) {
      return reply
        .code(401)
        .send(
          apiErrorBody(
            'UNAUTHORIZED',
            'No signed-in user. Run `pnpm db:seed` to add the sample users.',
          ),
        );
    }
    request.currentUser = user;
  });
}

/** The signed-in user, for routes registered under the hook above. */
export function requireCurrentUser(request: FastifyRequest): CurrentUser {
  // Only a wiring mistake (a route outside /api/v1) gets here: a bug, so a 500.
  if (!request.currentUser) throw new Error('No current user: is this route under /api/v1?');
  return request.currentUser;
}

function sampleUserKey(header: string | string[] | undefined): SampleUserKey | null {
  if (header === undefined) return 'a';
  return header === 'a' || header === 'b' ? header : null;
}
