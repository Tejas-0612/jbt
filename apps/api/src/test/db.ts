import type { Db } from '../db/client';
import { SAMPLE_USERS, type SampleUserKey } from '../db/sample-users';

/** Empties every table. All user data cascades from users, so one TRUNCATE covers it. */
export async function resetDb(db: Db): Promise<void> {
  await db.$executeRaw`TRUNCATE TABLE users CASCADE`;
}

/** Creates sample user A or B (see sample-users.ts) in the test database. */
export function createTestUser(db: Db, key: SampleUserKey) {
  return db.user.create({ data: SAMPLE_USERS[key] });
}
