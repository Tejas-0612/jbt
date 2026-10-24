import {
  apiErrorBodySchema,
  applicationListItemSchema,
  pageMetaSchema,
  validationErrorDetailsSchema,
  type ApplicationStatus,
} from '@jbt/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildApp } from '../../app';
import { createDb } from '../../db/client';
import { dateColumnFrom } from '../../lib/dates';
import { testConfig } from '../../test/config';
import { resetDb } from '../../test/db';
import { signedInUser } from '../../test/sign-in';
import { normalizeCompanyName } from '../companies/company-name';

// Integration tests: real routes, real service, real test database (`pnpm docker:up`).
const config = testConfig();
const db = createDb(config.DATABASE_URL);
const app = buildApp({ config, db });
afterAll(() => app.close());

type As = 'a' | 'b';
let signedIn: Record<As, Awaited<ReturnType<typeof signedInUser>>>;

// Each added application is updated one minute after the previous one, unless a test
// says otherwise, so "last updated first" has a clear answer.
let clock: number;
const nextMinute = () => new Date((clock += 60_000));

beforeEach(async () => {
  await resetDb(db);
  signedIn = { a: await signedInUser(db, config, 'a'), b: await signedInUser(db, config, 'b') };
  clock = Date.parse('2026-10-01T09:00:00.000Z');
});

interface NewApplication {
  role: string;
  company?: string;
  status?: ApplicationStatus;
  appliedOn?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  jobDescription?: string;
}

/** Inserts an application straight into the database, with the dates the test needs. */
async function add(application: NewApplication, as: As = 'a') {
  const userId = signedIn[as].user.id;
  const { company = 'Acme Corp', status = 'APPLIED', appliedOn = '2026-10-01' } = application;
  const normalizedName = normalizeCompanyName(company);
  const { id: companyId } = await db.company.upsert({
    where: { userId_normalizedName: { userId, normalizedName } },
    create: { userId, name: company, normalizedName },
    update: {},
  });
  const time = nextMinute();
  await db.application.create({
    data: {
      userId,
      companyId,
      roleTitle: application.role,
      status,
      appliedOn: appliedOn === null ? null : dateColumnFrom(appliedOn),
      jobDescription: application.jobDescription ?? null,
      createdAt: application.createdAt ?? time,
      updatedAt: application.updatedAt ?? time,
    },
  });
}

const list = (query = '', as: As = 'a') =>
  app.inject({
    method: 'GET',
    url: `/api/v1/applications${query}`,
    headers: signedIn[as].headers,
  });

/** Reading answers through the shared schemas also proves the API sends the agreed shapes. */
const pageIn = (body: unknown) =>
  z.object({ data: z.array(applicationListItemSchema), meta: pageMetaSchema }).parse(body);
const rolesIn = async (query = '', as: As = 'a') =>
  pageIn((await list(query, as)).json()).data.map((application) => application.roleTitle);
const errorIn = (body: unknown) => apiErrorBodySchema.parse(body).error;

describe('GET /api/v1/applications', () => {
  it('lists your own applications, last updated first, without job descriptions', async () => {
    await add({ role: 'First' });
    await add({ role: 'Second' });
    await add({ role: 'Third', jobDescription: 'A very long description' });

    const response = await list();

    expect(response.statusCode).toBe(200);
    const page = pageIn(response.json());
    expect(page.data.map((application) => application.roleTitle)).toEqual([
      'Third',
      'Second',
      'First',
    ]);
    expect(page.meta).toEqual({ page: 1, pageSize: 20, total: 3, totalPages: 1 });
    expect(page.data[0]?.company.name).toBe('Acme Corp');
    // The schema above drops unknown fields, so look at the raw answer.
    expect(response.json<{ data: object[] }>().data[0]).not.toHaveProperty('jobDescription');
  });

  it("never shows another user's applications, even when searching for their company", async () => {
    await add({ role: 'Mine', company: 'Acme Corp' });
    await add({ role: 'Theirs', company: 'Globex' }, 'b');

    expect(await rolesIn()).toEqual(['Mine']);
    expect(await rolesIn('?search=globex')).toEqual([]);
    expect(await rolesIn('', 'b')).toEqual(['Theirs']);
  });

  it('answers an empty page 1 when there is nothing yet', async () => {
    expect(pageIn((await list()).json())).toEqual({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
  });

  describe('pages', () => {
    it('splits the list into pages, with every application exactly once', async () => {
      const roles = Array.from({ length: 25 }, (_, i) => `Role ${String(i + 1).padStart(2, '0')}`);
      for (const role of roles) await add({ role });

      const pages = [];
      for (const page of [1, 2, 3])
        pages.push(pageIn((await list(`?pageSize=10&page=${page}`)).json()));

      expect(pages.map((page) => page.data.length)).toEqual([10, 10, 5]);
      expect(pages[2]?.meta).toEqual({ page: 3, pageSize: 10, total: 25, totalPages: 3 });
      const seen = pages.flatMap((page) => page.data.map((application) => application.roleTitle));
      expect(seen).toEqual(roles.toReversed());
    });

    it('keeps a fixed order when applications tie, so paging never repeats or skips one', async () => {
      const sameTime = new Date('2026-10-05T12:00:00.000Z');
      for (const role of ['One', 'Two', 'Three', 'Four', 'Five']) {
        await add({ role, updatedAt: sameTime });
      }

      const seen = [];
      for (const page of [1, 2, 3]) seen.push(...(await rolesIn(`?pageSize=2&page=${page}`)));

      // Same last update: the one added last comes first.
      expect(seen).toEqual(['Five', 'Four', 'Three', 'Two', 'One']);
    });

    it('answers an empty page past the end, with the real totals', async () => {
      await add({ role: 'Only one' });

      expect(pageIn((await list('?page=5')).json())).toEqual({
        data: [],
        meta: { page: 5, pageSize: 20, total: 1, totalPages: 1 },
      });
    });
  });

  describe('filters and search', () => {
    it('filters by one status or several, and counts only what matches', async () => {
      await add({ role: 'Applied', status: 'APPLIED' });
      await add({ role: 'Screening', status: 'SCREENING' });
      await add({ role: 'Rejected', status: 'REJECTED' });

      expect(await rolesIn('?status=SCREENING')).toEqual(['Screening']);
      const page = pageIn((await list('?status=APPLIED,REJECTED&pageSize=1')).json());
      expect(page.data.map((application) => application.roleTitle)).toEqual(['Rejected']);
      expect(page.meta).toMatchObject({ total: 2, totalPages: 2 });
    });

    it('searches the company name and the role, in any case, for any part', async () => {
      await add({ role: 'Frontend Developer', company: 'Acme Corp' });
      await add({ role: 'Backend Engineer', company: 'Frontier Labs' });
      await add({ role: 'Designer', company: 'Globex' });

      expect(await rolesIn('?search=FRONT')).toEqual(['Backend Engineer', 'Frontend Developer']);
      expect(await rolesIn('?search=lobe')).toEqual(['Designer']);
      expect(await rolesIn('?search=%20engineer%20')).toEqual(['Backend Engineer']);
    });

    it('treats %, _ and \\ in a search as plain characters', async () => {
      await add({ role: 'Growth 100%' });
      await add({ role: 'Growth 1000' });
      await add({ role: 'snake_case' });
      await add({ role: 'snakeXcase' });
      await add({ role: 'back\\slash' });
      await add({ role: 'backslash' });

      // In SQL LIKE, % means "anything", _ "any one character", and \ escapes the next one.
      const search = async (text: string) => rolesIn(`?search=${encodeURIComponent(text)}`);
      expect(await search('100%')).toEqual(['Growth 100%']);
      expect(await search('e_c')).toEqual(['snake_case']);
      expect(await search('k\\s')).toEqual(['back\\slash']);
    });
  });

  describe('sorting', () => {
    it('sorts by applied date with saved jobs last, in both directions', async () => {
      await add({ role: 'Saved', status: 'SAVED', appliedOn: null });
      await add({ role: '10 Oct', appliedOn: '2026-10-10' });
      await add({ role: '5 Oct', appliedOn: '2026-10-05' });

      expect(await rolesIn('?sortBy=appliedOn')).toEqual(['10 Oct', '5 Oct', 'Saved']);
      expect(await rolesIn('?sortBy=appliedOn&order=asc')).toEqual(['5 Oct', '10 Oct', 'Saved']);
    });

    it('sorts by company name A–Z by default, ignoring case', async () => {
      for (const company of ['beta', 'Zeta', 'Acme', 'acorn'])
        await add({ role: company, company });

      expect(await rolesIn('?sortBy=company')).toEqual(['Acme', 'acorn', 'beta', 'Zeta']);
      expect(await rolesIn('?sortBy=company&order=desc')).toEqual([
        'Zeta',
        'beta',
        'acorn',
        'Acme',
      ]);
    });

    it('sorts by the date an application was added', async () => {
      await add({ role: 'Added first, updated last', updatedAt: new Date('2026-10-20') });
      await add({ role: 'Added second', updatedAt: new Date('2026-10-10') });

      expect(await rolesIn('?sortBy=createdAt&order=asc')).toEqual([
        'Added first, updated last',
        'Added second',
      ]);
      expect(await rolesIn()).toEqual(['Added first, updated last', 'Added second']);
      expect(await rolesIn('?sortBy=createdAt')).toEqual([
        'Added second',
        'Added first, updated last',
      ]);
    });
  });

  // The full set of rules is tested in packages/shared; these prove the route uses them.
  it.each([
    ['?page=0', 'page'],
    ['?page=1&page=2', 'page'],
    ['?pageSize=500', 'pageSize'],
    ['?status=FOO', 'status'],
    ['?sortBy=password', 'sortBy'],
  ])('refuses %s with 400 and says which setting is wrong', async (query, field) => {
    const response = await list(query);

    expect(response.statusCode).toBe(400);
    const error = errorIn(response.json());
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(validationErrorDetailsSchema.parse(error.details).fieldErrors[field]).toBeDefined();
  });

  it('refuses unknown settings with 400', async () => {
    const response = await list('?companyId=123');

    expect(response.statusCode).toBe(400);
    expect(validationErrorDetailsSchema.parse(errorIn(response.json()).details).formErrors).toEqual(
      ['Unrecognized key: "companyId"'],
    );
  });

  it('answers 401 when signed out', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/applications' });

    expect(response.statusCode).toBe(401);
    expect(errorIn(response.json()).code).toBe('UNAUTHORIZED');
  });
});
