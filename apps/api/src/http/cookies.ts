import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply } from 'fastify';
import type { Config } from '../config/env';

/*
 * Our cookies, all set the same way:
 * - HttpOnly: page scripts can't read them, so even an XSS bug can't steal a session.
 * - SameSite=Lax: other sites' forms and background requests don't carry them.
 * - Production: Secure (HTTPS only) and a "__Host-" name, which makes the browser
 *   refuse a cookie of that name from a subdomain or for another path.
 */

export function cookieNames(config: Config) {
  const prefix = config.NODE_ENV === 'production' ? '__Host-' : '';
  return {
    /** The session token: who is signed in. */
    session: `${prefix}jbt_session`,
    /** The one-time checks for a Google sign-in in progress (10 minutes). */
    signIn: `${prefix}jbt_sign_in`,
  };
}

export function cookieOptions(config: Config): CookieSerializeOptions {
  return { httpOnly: true, sameSite: 'lax', secure: config.NODE_ENV === 'production', path: '/' };
}

/** The cookie lives exactly as long as the session, and moves with it when it is renewed. */
export function setSessionCookie(
  reply: FastifyReply,
  config: Config,
  token: string,
  expiresAt: Date,
): void {
  void reply.setCookie(cookieNames(config).session, token, {
    ...cookieOptions(config),
    expires: expiresAt,
  });
}

export function clearSessionCookie(reply: FastifyReply, config: Config): void {
  void reply.clearCookie(cookieNames(config).session, cookieOptions(config));
}
