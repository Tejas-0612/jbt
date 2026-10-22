// Development data. Run with `pnpm db:seed`, after `pnpm db:migrate`
// (Prisma 7 no longer seeds automatically after a migration).
// Safe to run again: users are matched by googleSub and updated, not duplicated.
import { loadConfig } from '../src/config/env';
import { createDb } from '../src/db/client';
import { SAMPLE_USERS } from '../src/db/sample-users';

const config = loadConfig();
if (config.NODE_ENV === 'production') {
  throw new Error('Refusing to seed: NODE_ENV is production. Sample users are for development.');
}

const db = createDb(config.DATABASE_URL);
try {
  for (const user of Object.values(SAMPLE_USERS)) {
    await db.user.upsert({ where: { googleSub: user.googleSub }, create: user, update: user });
  }
  const names = Object.values(SAMPLE_USERS).map((user) => user.name);
  console.log(`Seeded ${names.length} sample users: ${names.join(', ')}`);
} finally {
  await db.$disconnect();
}
