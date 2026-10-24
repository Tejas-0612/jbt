import type { Me } from '@jbt/shared';
import type { Db } from '../../db/client';

/** The signed-in user's own details. */
export function getMe(db: Db, userId: string): Promise<Me> {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, timezone: true },
  });
}
