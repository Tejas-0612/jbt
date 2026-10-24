import type { Me } from '@jbt/shared';
import type { FastifyPluginCallback } from 'fastify';
import type { Db } from '../../db/client';
import { requireCurrentUser } from '../../http/current-user';
import { getMe } from './users.service';

interface UserRoutesOptions {
  db: Db;
}

/** The signed-in user. The web app calls /me to know whether, and as whom, you are signed in. */
export const userRoutes: FastifyPluginCallback<UserRoutesOptions> = (app, { db }, done) => {
  app.get('/me', async (request) => {
    const user = requireCurrentUser(request);
    return { data: await getMe(db, user.id) } satisfies { data: Me };
  });

  done();
};
