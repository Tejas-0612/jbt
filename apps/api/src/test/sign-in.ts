import type { Config } from '../config/env';
import type { Db } from '../db/client';
import type { SampleUserKey } from '../db/sample-users';
import { cookieNames } from '../http/cookies';
import { createSession } from '../modules/sessions/sessions.service';
import { createTestUser } from './db';

/**
 * Sample user A or B, signed in for real: the user, a session, and the headers a
 * browser would send with every request (the session cookie and our Origin).
 */
export async function signedInUser(db: Db, config: Config, key: SampleUserKey) {
  const user = await createTestUser(db, key);
  const { token } = await createSession(db, user.id);
  return {
    user,
    token,
    headers: { cookie: `${cookieNames(config).session}=${token}`, origin: config.WEB_ORIGIN },
  };
}
