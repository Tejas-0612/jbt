/**
 * Made-up users for development (`pnpm db:seed`, and the dev login, which creates them
 * if missing) and tests. Two of them, so we can check that A never sees B's data.
 * Never created in production: the seed refuses, and the dev login doesn't exist there.
 */
export const SAMPLE_USERS = {
  a: {
    googleSub: 'dev-user-a',
    email: 'user-a@example.com',
    name: 'Sample User A',
    timezone: 'Asia/Kolkata',
  },
  // Behind UTC on purpose: date bugs that only appear west of London show up in dev.
  b: {
    googleSub: 'dev-user-b',
    email: 'user-b@example.com',
    name: 'Sample User B',
    timezone: 'America/New_York',
  },
} as const;

export type SampleUserKey = keyof typeof SAMPLE_USERS;
