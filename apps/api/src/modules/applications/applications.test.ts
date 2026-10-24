import { apiErrorBodySchema, applicationSchema, validationErrorDetailsSchema } from '@jbt/shared';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { buildApp } from '../../app';
import { createDb, type Db } from '../../db/client';
import { testConfig } from '../../test/config';
import { createTestUser, resetDb } from '../../test/db';

// Integration tests: real routes, real service, real test database (`pnpm docker:up`).
const config = testConfig();
const db = createDb(config.DATABASE_URL);
const app = buildApp({ config, db });
afterAll(() => app.close());

// A fixed "now" for the date rules: 02:00 UTC on 23 Oct 2026 is already the 23rd
// in Kolkata (user A) but still the evening of the 22nd in New York (user B).
const NOW = new Date('2026-10-23T02:00:00.000Z');
const A_TODAY = '2026-10-23';
const B_TODAY = '2026-10-22';

let userA: Awaited<ReturnType<typeof createTestUser>>;
let userB: Awaited<ReturnType<typeof createTestUser>>;

beforeEach(async () => {
  // Only Date is faked; real timers keep the database driver working.
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  await resetDb(db);
  userA = await createTestUser(db, 'a');
  userB = await createTestUser(db, 'b');
});
afterEach(() => {
  vi.useRealTimers();
});

const valid = {
  companyName: 'Acme Corp',
  roleTitle: 'Backend Engineer',
  status: 'APPLIED',
  appliedOn: A_TODAY,
};

type As = 'a' | 'b';
const post = (payload: object, as: As = 'a') =>
  app.inject({
    method: 'POST',
    url: '/api/v1/applications',
    payload,
    headers: { 'x-dev-user': as },
  });
const get = (id: string, as: As = 'a') =>
  app.inject({ method: 'GET', url: `/api/v1/applications/${id}`, headers: { 'x-dev-user': as } });

/** Reading answers through the shared schemas also proves the API sends the agreed shapes. */
const applicationIn = (body: unknown) => z.object({ data: applicationSchema }).parse(body).data;
const errorIn = (body: unknown) => apiErrorBodySchema.parse(body).error;
const detailsIn = (body: unknown) => validationErrorDetailsSchema.parse(errorIn(body).details);

const countRows = async () => ({
  companies: await db.company.count(),
  applications: await db.application.count(),
  activities: await db.activity.count(),
});
const NOTHING_SAVED = { companies: 0, applications: 0, activities: 0 };

describe('POST /api/v1/applications', () => {
  it('creates the application, its company and its first timeline event', async () => {
    const response = await post(valid);

    expect(response.statusCode).toBe(201);
    const application = applicationIn(response.json());
    expect(application).toMatchObject({
      status: 'APPLIED',
      roleTitle: 'Backend Engineer',
      company: { name: 'Acme Corp' },
      appliedOn: A_TODAY,
      jobUrl: null,
      location: null,
      workMode: null,
      jobDescription: null,
    });

    // Everything belongs to the signed-in user, and the event is "→ APPLIED, just now".
    const saved = await db.application.findUniqueOrThrow({
      where: { id: application.id },
      include: { company: true, activities: true },
    });
    expect(saved.userId).toBe(userA.id);
    expect(saved.company.userId).toBe(userA.id);
    expect(saved.activities).toEqual([
      expect.objectContaining({
        userId: userA.id,
        type: 'STATUS_CHANGED',
        fromStatus: null,
        toStatus: 'APPLIED',
        occurredAt: NOW,
      }),
    ]);
  });

  it("dates the first event at noon of an earlier applied day, in the user's timezone", async () => {
    const application = applicationIn((await post({ ...valid, appliedOn: '2026-10-07' })).json());

    const event = await db.activity.findFirstOrThrow({ where: { applicationId: application.id } });
    // Noon in Kolkata (UTC+5:30) is 06:30 UTC.
    expect(event.occurredAt.toISOString()).toBe('2026-10-07T06:30:00.000Z');
  });

  it('saves a job that was only saved, with no applied date', async () => {
    const response = await post({ ...valid, status: 'SAVED', appliedOn: undefined });

    expect(response.statusCode).toBe(201);
    const application = applicationIn(response.json());
    expect(application).toMatchObject({ status: 'SAVED', appliedOn: null });
    const event = await db.activity.findFirstOrThrow({ where: { applicationId: application.id } });
    expect(event).toMatchObject({ toStatus: 'SAVED', occurredAt: NOW });
  });

  it('stores the optional fields, cleaned up', async () => {
    const response = await post({
      ...valid,
      jobUrl: 'https://jobs.example.com/42',
      location: '  Pune ',
      workMode: 'HYBRID',
      jobDescription: 'Build and run APIs.',
    });

    expect(applicationIn(response.json())).toMatchObject({
      jobUrl: 'https://jobs.example.com/42',
      location: 'Pune',
      workMode: 'HYBRID',
      jobDescription: 'Build and run APIs.',
    });
  });

  describe('companies', () => {
    it('reuses the company when its name is typed differently', async () => {
      const first = applicationIn((await post(valid)).json());
      const second = applicationIn(
        (await post({ ...valid, companyName: '  acme   CORP ' })).json(),
      );

      expect(second.company).toEqual(first.company);
      expect(second.company.name).toBe('Acme Corp'); // the first spelling is kept
      expect(await db.company.count()).toBe(1);
    });

    it('gives each user their own company, even with the same name', async () => {
      const fromA = applicationIn((await post(valid, 'a')).json());
      const fromB = applicationIn((await post({ ...valid, appliedOn: B_TODAY }, 'b')).json());

      expect(fromB.company.id).not.toBe(fromA.company.id);
      const owners = await db.company.findMany({
        select: { userId: true },
        orderBy: { name: 'asc' },
      });
      expect(owners.map((company) => company.userId).sort()).toEqual([userA.id, userB.id].sort());
    });

    it('recovers when another save creates the same new company at the same moment', async () => {
      // Real timing can't be forced, so stage the collision. Prisma's upsert looks for
      // the company, then inserts it. Here, on the first upsert, "another request" saves
      // the company first, and this request's insert hits the unique index: a real P2002.
      const baseDb = createDb(config.DATABASE_URL);
      let collided = false;
      const racingDb = baseDb.$extends({
        query: {
          company: {
            async upsert({ args, query }) {
              if (!collided) {
                collided = true;
                await baseDb.company.create({ data: args.create }); // the other request
                await baseDb.company.create({ data: args.create }); // ours: unique violation
              }
              return query(args);
            },
          },
        },
      });
      const racingApp = buildApp({ config, db: racingDb as unknown as Db });

      const response = await racingApp.inject({
        method: 'POST',
        url: '/api/v1/applications',
        payload: valid,
      });
      await racingApp.close();

      expect(collided).toBe(true);
      expect(response.statusCode).toBe(201); // the service retried and found the company
      expect(await countRows()).toEqual({ companies: 1, applications: 1, activities: 1 });
    });
  });

  describe('refuses bad input with 400, and saves nothing', () => {
    it.each([
      { problem: 'no company name', change: { companyName: undefined }, field: 'companyName' },
      { problem: 'a blank role', change: { roleTitle: '   ' }, field: 'roleTitle' },
      { problem: 'an unknown status', change: { status: 'INTERVIEW' }, field: 'status' },
      { problem: 'a javascript: link', change: { jobUrl: 'javascript:alert(1)' }, field: 'jobUrl' },
      { problem: 'an impossible date', change: { appliedOn: '2026-13-01' }, field: 'appliedOn' },
      { problem: 'a date in the future', change: { appliedOn: '2026-10-24' }, field: 'appliedOn' },
      { problem: 'a date on a saved job', change: { status: 'SAVED' }, field: 'appliedOn' },
      { problem: 'no date on an applied job', change: { appliedOn: null }, field: 'appliedOn' },
      {
        problem: 'a company name that is too long',
        change: { companyName: 'x'.repeat(201) },
        field: 'companyName',
      },
    ])('$problem', async ({ change, field }) => {
      const response = await post({ ...valid, ...change });

      expect(response.statusCode).toBe(400);
      expect(errorIn(response.json()).code).toBe('VALIDATION_ERROR');
      expect(detailsIn(response.json()).fieldErrors[field]).toHaveLength(1);
      expect(await countRows()).toEqual(NOTHING_SAVED);
    });

    it('a userId in the body, so nobody can write into another account', async () => {
      const response = await post({ ...valid, userId: userB.id });

      expect(response.statusCode).toBe(400);
      expect(detailsIn(response.json()).formErrors).toEqual(['Unrecognized key: "userId"']);
      expect(await countRows()).toEqual(NOTHING_SAVED);
    });
  });

  it("checks 'not in the future' against the user's own date", async () => {
    // At this moment it is already the 23rd in Kolkata (A) but still the 22nd in New York (B).
    expect((await post({ ...valid, appliedOn: A_TODAY }, 'a')).statusCode).toBe(201);
    expect((await post({ ...valid, appliedOn: A_TODAY }, 'b')).statusCode).toBe(400);
    expect((await post({ ...valid, appliedOn: B_TODAY }, 'b')).statusCode).toBe(201);
  });

  it('saves nothing at all when a step fails halfway', async () => {
    // A database whose activity insert always fails: the company and application
    // were already written inside the transaction, so they must be rolled back.
    const failingDb = createDb(config.DATABASE_URL).$extends({
      query: { activity: { create: () => Promise.reject(new Error('simulated failure')) } },
    });
    const failingApp = buildApp({ config, db: failingDb as unknown as Db });

    const response = await failingApp.inject({
      method: 'POST',
      url: '/api/v1/applications',
      payload: valid,
    });
    await failingApp.close();

    expect(response.statusCode).toBe(500);
    expect(errorIn(response.json()).code).toBe('INTERNAL_ERROR');
    expect(await countRows()).toEqual(NOTHING_SAVED);
  });
});

describe('GET /api/v1/applications/:id', () => {
  it('returns your own application, exactly as it was created', async () => {
    const created = applicationIn((await post(valid)).json());

    const response = await get(created.id);

    expect(response.statusCode).toBe(200);
    expect(applicationIn(response.json())).toEqual(created);
  });

  it("answers 404 for another user's application, as if it didn't exist", async () => {
    const created = applicationIn((await post(valid, 'a')).json());

    const response = await get(created.id, 'b');

    expect(response.statusCode).toBe(404);
    expect(errorIn(response.json())).toEqual({
      code: 'NOT_FOUND',
      message: 'Application not found',
    });
  });

  it('answers 404 for an unknown or malformed id', async () => {
    expect((await get(randomUUID())).statusCode).toBe(404);
    expect((await get('not-an-id')).statusCode).toBe(404);
  });
});

describe('the stand-in signed-in user', () => {
  it('answers 401 when the sample users are missing', async () => {
    await resetDb(db);

    const response = await post(valid);

    expect(response.statusCode).toBe(401);
    expect(errorIn(response.json()).message).toContain('pnpm db:seed');
  });

  it('answers 401 for an unknown x-dev-user', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/applications/${randomUUID()}`,
      headers: { 'x-dev-user': 'c' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('answers 401 to everyone in production, until real sign-in exists', async () => {
    const productionApp = buildApp({
      config: { ...config, NODE_ENV: 'production' },
      db: createDb(config.DATABASE_URL),
    });

    const responses = [
      await productionApp.inject({ method: 'POST', url: '/api/v1/applications', payload: valid }),
      await productionApp.inject({ method: 'GET', url: `/api/v1/applications/${randomUUID()}` }),
    ];
    await productionApp.close();

    expect(responses.map((response) => response.statusCode)).toEqual([401, 401]);
    expect(await countRows()).toEqual(NOTHING_SAVED);
  });
});
