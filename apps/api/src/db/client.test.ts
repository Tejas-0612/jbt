import { describe, expect, it } from 'vitest';
import { describeDbError, pingDatabase, type Db } from './client';

describe('pingDatabase', () => {
  it('gives up when the database never answers', async () => {
    const hangingDb = { $queryRaw: () => new Promise(() => {}) } as unknown as Pick<
      Db,
      '$queryRaw'
    >;

    await expect(pingDatabase(hangingDb, 50)).rejects.toThrow(/did not answer within 50 ms/);
  });
});

describe('describeDbError', () => {
  it('prefers the error code, which says more than Prisma’s message', () => {
    const refused = Object.assign(new Error('Invalid `prisma.$queryRaw()` invocation'), {
      code: 'ECONNREFUSED',
    });

    expect(describeDbError(refused)).toBe('ECONNREFUSED');
  });

  it('falls back to the message when there is no code', () => {
    expect(describeDbError(new Error('database did not answer within 2000 ms'))).toBe(
      'database did not answer within 2000 ms',
    );
  });
});
