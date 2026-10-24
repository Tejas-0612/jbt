import { APPLICATION_STATUSES } from '@jbt/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { testConfig } from '../test/config';
import { createTestUser, resetDb } from '../test/db';
import { createDb } from './client';

// Integration tests: they need Docker running (`pnpm docker:up`).
// They check rules the database itself enforces, whatever the code above it does.
describe('database schema', () => {
  const db = createDb(testConfig().DATABASE_URL);
  beforeEach(() => resetDb(db));
  afterAll(() => db.$disconnect());

  /** A user with a session, one company, one application and that application's first activity. */
  async function createUserWithData(key: 'a' | 'b') {
    const user = await createTestUser(db, key);
    await db.session.create({
      data: { userId: user.id, tokenHash: `hash-of-${key}`, expiresAt: new Date() },
    });
    const company = await db.company.create({
      data: { userId: user.id, name: 'Acme Corp', normalizedName: 'acme corp' },
    });
    const application = await db.application.create({
      data: { userId: user.id, companyId: company.id, roleTitle: 'Engineer', status: 'SAVED' },
    });
    await db.activity.create({
      data: {
        userId: user.id,
        applicationId: application.id,
        type: 'STATUS_CHANGED',
        toStatus: 'SAVED',
        occurredAt: new Date(),
      },
    });
    return { user, company, application };
  }

  it('has exactly the statuses listed in @jbt/shared, in the same order', async () => {
    const rows = await db.$queryRaw<{ status: string }[]>`
      SELECT unnest(enum_range(NULL::application_status))::text AS status`;

    expect(rows.map((row) => row.status)).toEqual([...APPLICATION_STATUSES]);
  });

  describe('companies', () => {
    it('refuses a second company with the same normalised name for one user', async () => {
      const { user } = await createUserWithData('a');

      await expect(
        db.company.create({
          data: { userId: user.id, name: 'ACME corp', normalizedName: 'acme corp' },
        }),
      ).rejects.toMatchObject({ code: 'P2002' }); // unique constraint failed
    });

    it('lets two users each have their own company with the same name', async () => {
      await createUserWithData('a');
      await createUserWithData('b');

      expect(await db.company.count({ where: { normalizedName: 'acme corp' } })).toBe(2);
    });

    it('cannot be deleted while it still has applications', async () => {
      const { company } = await createUserWithData('a');

      await expect(db.company.delete({ where: { id: company.id } })).rejects.toMatchObject({
        code: 'P2003', // foreign key constraint failed
      });
    });
  });

  describe("links to another user's data are refused", () => {
    it("an application pointing at another user's company", async () => {
      const a = await createUserWithData('a');
      const b = await createUserWithData('b');

      await expect(
        db.application.create({
          data: {
            userId: a.user.id,
            companyId: b.company.id,
            roleTitle: 'Engineer',
            status: 'SAVED',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });

    it("an activity pointing at another user's application", async () => {
      const a = await createUserWithData('a');
      const b = await createUserWithData('b');

      await expect(
        db.activity.create({
          data: {
            userId: a.user.id,
            applicationId: b.application.id,
            type: 'STATUS_CHANGED',
            toStatus: 'SAVED',
            occurredAt: new Date(),
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  it("deleting a user deletes all of their data and nobody else's", async () => {
    const a = await createUserWithData('a');
    const b = await createUserWithData('b');

    await db.user.delete({ where: { id: a.user.id } });

    const rowsOwnedBy = async (userId: string) => ({
      sessions: await db.session.count({ where: { userId } }),
      companies: await db.company.count({ where: { userId } }),
      applications: await db.application.count({ where: { userId } }),
      activities: await db.activity.count({ where: { userId } }),
    });
    expect(await rowsOwnedBy(a.user.id)).toEqual({
      sessions: 0,
      companies: 0,
      applications: 0,
      activities: 0,
    });
    expect(await rowsOwnedBy(b.user.id)).toEqual({
      sessions: 1,
      companies: 1,
      applications: 1,
      activities: 1,
    });
  });
});
