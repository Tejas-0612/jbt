import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

export type Db = PrismaClient;

/**
 * Creates the database client. Prisma 7 talks to Postgres through the official
 * `pg` driver (via the adapter). Connections open lazily, on the first query.
 */
export function createDb(databaseUrl: string): Db {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

/**
 * A short, log-friendly reason for a failed database call. Prisma's message for a
 * refused connection is just "Invalid `prisma.$queryRaw()` invocation", so prefer
 * the error code (e.g. ECONNREFUSED = nothing is listening on that host/port).
 */
export function describeDbError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error;
    if (typeof code === 'string') return code;
  }
  return error instanceof Error ? error.message.trim() : String(error);
}

/**
 * Resolves if the database answers a trivial query within `timeoutMs`, rejects otherwise.
 * The time limit matters: an unreachable host can make a connection attempt hang.
 */
export async function pingDatabase(db: Pick<Db, '$queryRaw'>, timeoutMs = 2000): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`database did not answer within ${timeoutMs} ms`));
    }, timeoutMs);
  });

  try {
    await Promise.race([db.$queryRaw`SELECT 1`, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
