import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createDb } from '../../db/client';
import { testConfig } from '../../test/config';
import { createTestUser, resetDb } from '../../test/db';
import {
  SESSION_LIFETIME_MS,
  createSession,
  findValidSession,
  revokeSession,
} from './sessions.service';

// Integration tests: they need Docker running (`pnpm docker:up`).
describe('sessions', () => {
  const db = createDb(testConfig().DATABASE_URL);
  beforeEach(() => resetDb(db));
  afterAll(() => db.$disconnect());

  const DAY_MS = 24 * 60 * 60 * 1000;
  const start = new Date('2026-10-01T09:00:00Z');
  const daysAfterStart = (days: number) => new Date(start.getTime() + days * DAY_MS);

  it('stores only a hash of the token, never the token itself', async () => {
    const user = await createTestUser(db, 'a');

    const { token, expiresAt } = await createSession(db, user.id, start);

    const rows = await db.session.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(rows)).not.toContain(token);
    expect(expiresAt).toEqual(new Date(start.getTime() + SESSION_LIFETIME_MS));
  });

  it('gives every sign-in a different token', async () => {
    const user = await createTestUser(db, 'a');

    const first = await createSession(db, user.id);
    const second = await createSession(db, user.id);

    expect(first.token).not.toBe(second.token);
  });

  it("finds the session's user from its token", async () => {
    const user = await createTestUser(db, 'b');
    const { token } = await createSession(db, user.id, start);

    const session = await findValidSession(db, token, start);

    expect(session?.user).toEqual({ id: user.id, timezone: 'America/New_York' });
  });

  it('finds nothing for an unknown token', async () => {
    const user = await createTestUser(db, 'a');
    await createSession(db, user.id, start);

    expect(await findValidSession(db, 'made-up-token', start)).toBeNull();
  });

  describe('expiry', () => {
    it('ends a session left unused for 30 days', async () => {
      const user = await createTestUser(db, 'a');
      const almost = await createSession(db, user.id, start);
      const idle = await createSession(db, user.id, start);

      expect(await findValidSession(db, almost.token, daysAfterStart(29.9))).not.toBeNull();
      expect(await findValidSession(db, idle.token, daysAfterStart(30))).toBeNull();
    });

    it('keeps a session alive while it is used', async () => {
      const user = await createTestUser(db, 'a');
      const { token } = await createSession(db, user.id, start);

      const renewed = await findValidSession(db, token, daysAfterStart(20));
      expect(renewed?.renewed).toBe(true);
      expect(renewed?.expiresAt).toEqual(daysAfterStart(50));

      // Past the original 30 days, but only 25 days since it was last used.
      expect(await findValidSession(db, token, daysAfterStart(45))).not.toBeNull();
    });

    it('writes the new expiry at most once a day', async () => {
      const user = await createTestUser(db, 'a');
      const { token, expiresAt } = await createSession(db, user.id, start);

      const sameDay = await findValidSession(db, token, daysAfterStart(0.5));

      expect(sameDay).toMatchObject({ renewed: false, expiresAt });
      const row = await db.session.findFirstOrThrow();
      expect(row.expiresAt).toEqual(expiresAt);
    });
  });

  describe('signing out', () => {
    it('ends the session', async () => {
      const user = await createTestUser(db, 'a');
      const { token } = await createSession(db, user.id, start);

      // Same day as sign-in, so the lookup doesn't try to renew it.
      await revokeSession(db, token, daysAfterStart(0.5));

      expect(await findValidSession(db, token, daysAfterStart(0.5))).toBeNull();
      // Kept as a record, not deleted.
      const row = await db.session.findFirstOrThrow();
      expect(row.revokedAt).toEqual(daysAfterStart(0.5));
    });

    it("leaves the user's other sessions (other devices) signed in", async () => {
      const user = await createTestUser(db, 'a');
      const laptop = await createSession(db, user.id, start);
      const phone = await createSession(db, user.id, start);

      await revokeSession(db, laptop.token, start);

      expect(await findValidSession(db, phone.token, start)).not.toBeNull();
    });

    it('is fine with signing out twice, or with an unknown token', async () => {
      const user = await createTestUser(db, 'a');
      const { token } = await createSession(db, user.id, start);

      await revokeSession(db, token, daysAfterStart(1));
      await revokeSession(db, token, daysAfterStart(2));
      await revokeSession(db, 'made-up-token');

      // The first sign-out time is kept.
      const row = await db.session.findFirstOrThrow();
      expect(row.revokedAt).toEqual(daysAfterStart(1));
    });
  });
});
