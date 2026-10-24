import { createHash, randomBytes } from 'node:crypto';
import type { User } from '../../../generated/prisma/client';
import type { Db } from '../../db/client';

/*
 * Sessions: how a browser stays signed in. Plain functions with no Fastify in them.
 *
 * The browser's cookie holds a random token. The database stores only the token's
 * SHA-256 hash, so a session can be found from the cookie, but not the other way
 * round: someone with a copy of the sessions table still can't sign in.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** A session ends after this long without being used. */
export const SESSION_LIFETIME_MS = 30 * DAY_MS;

/** Using a session pushes its expiry forward, but writes to the database at most this often. */
const RENEW_AFTER_MS = DAY_MS;

export interface NewSession {
  /** Goes into the cookie. Never stored, so it can't be read back later. */
  token: string;
  expiresAt: Date;
}

export interface ValidSession {
  user: Pick<User, 'id' | 'timezone'>;
  expiresAt: Date;
  /** True when this lookup pushed expiresAt forward, so the cookie needs the new date too. */
  renewed: boolean;
}

/** Starts a new session for the user. Every sign-in gets a fresh token. */
export async function createSession(
  db: Db,
  userId: string,
  now: Date = new Date(),
): Promise<NewSession> {
  // 32 random bytes = 256 bits: impossible to guess. base64url keeps it cookie-safe.
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  return { token, expiresAt };
}

/**
 * The signed-in user behind a cookie token, or null if the session is unknown,
 * expired or signed out. Renews the expiry while the session is in use.
 */
export async function findValidSession(
  db: Db,
  token: string,
  now: Date = new Date(),
): Promise<ValidSession | null> {
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      user: { select: { id: true, timezone: true } },
    },
  });
  if (!session || session.revokedAt || session.expiresAt <= now) return null;

  // Renewed less than a day ago: leave it, so a busy session isn't a write per request.
  const renewedAt = session.expiresAt.getTime() - SESSION_LIFETIME_MS;
  if (now.getTime() - renewedAt < RENEW_AFTER_MS) {
    return { user: session.user, expiresAt: session.expiresAt, renewed: false };
  }

  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
  // updateMany, not update: if the user signed out in the meantime (another tab),
  // nothing matches and the sign-out wins, instead of an error.
  const { count } = await db.session.updateMany({
    where: { id: session.id, revokedAt: null },
    data: { expiresAt },
  });
  return count === 0 ? null : { user: session.user, expiresAt, renewed: true };
}

/** Signs a session out. An unknown or already-ended session is fine (signing out twice). */
export async function revokeSession(db: Db, token: string, now: Date = new Date()): Promise<void> {
  await db.session.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: now },
  });
}

// A fast hash is enough here: passwords need a slow one (bcrypt) because people pick
// guessable ones, but a 256-bit random token can't be guessed, however fast you hash.
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
