import type { Db } from '../../db/client';
import { createSession, type NewSession } from '../sessions/sessions.service';

/** Who is signing in: from Google, or a sample user in development. */
export interface SignInIdentity {
  googleSub: string;
  email: string;
  name: string;
}

/**
 * Signs a user in: finds them by their Google id, or creates them on their first
 * sign-in, then starts a new session. Email and name are refreshed every time, since
 * they can change at Google (the id can't). The timezone is used only for a new user.
 */
export async function signIn(
  db: Db,
  identity: SignInIdentity,
  timezone: string,
  now: Date = new Date(),
): Promise<NewSession & { userId: string }> {
  // Prisma runs this as one INSERT ... ON CONFLICT (seen in the query log), so two
  // first sign-ins at the same moment can't both try to create the user.
  const { googleSub, email, name } = identity;
  const user = await db.user.upsert({
    where: { googleSub },
    // Fields named one by one, not `...identity`: the object passed in may carry more
    // (Google's has emailVerified), and TypeScript lets extra fields through.
    create: { googleSub, email, name, timezone },
    update: { email, name },
    select: { id: true },
  });
  const session = await createSession(db, user.id, now);
  return { userId: user.id, ...session };
}
