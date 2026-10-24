import type {
  Application,
  ApplicationListItem,
  CreateApplicationInput,
  ListApplicationsQuery,
  PageMeta,
} from '@jbt/shared';
import { Prisma, type User } from '../../../generated/prisma/client';
import type { Db } from '../../db/client';
import { dateColumnFrom, isoDateFrom, noonOn, todayIn } from '../../lib/dates';
import { normalizeCompanyName } from '../companies/company-name';

/*
 * Business logic for applications. Plain functions with no Fastify in them, so the
 * HTTP framework could be swapped without touching this file. Every query is scoped
 * to the user it is given; nothing here trusts an id from the request on its own.
 */

const withCompany = {
  company: { select: { id: true, name: true } },
} satisfies Prisma.ApplicationInclude;
type ApplicationRow = Prisma.ApplicationGetPayload<{ include: typeof withCompany }>;
// The list leaves out the job description: up to 50,000 characters each, never shown there.
const listOmit = { jobDescription: true } satisfies Prisma.ApplicationOmit;
type ApplicationListRow = Prisma.ApplicationGetPayload<{
  include: typeof withCompany;
  omit: typeof listOmit;
}>;

/**
 * Creates an application, finding or creating its company by name, and records the
 * first timeline event. All of it in one transaction: either everything is saved, or nothing.
 */
export async function createApplication(
  db: Db,
  user: Pick<User, 'id' | 'timezone'>,
  input: CreateApplicationInput,
  now: Date = new Date(),
): Promise<Application> {
  const save = () =>
    db.$transaction(async (tx) => {
      const normalizedName = normalizeCompanyName(input.companyName);
      const company = await tx.company.upsert({
        where: { userId_normalizedName: { userId: user.id, normalizedName } },
        // A new company keeps the spelling the user typed first.
        create: { userId: user.id, name: input.companyName, normalizedName },
        update: {},
      });

      const application = await tx.application.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleTitle: input.roleTitle,
          status: input.status,
          appliedOn: input.appliedOn === null ? null : dateColumnFrom(input.appliedOn),
          jobUrl: input.jobUrl,
          location: input.location,
          workMode: input.workMode,
          jobDescription: input.jobDescription,
        },
        include: withCompany,
      });

      await tx.activity.create({
        data: {
          userId: user.id,
          applicationId: application.id,
          type: 'STATUS_CHANGED',
          fromStatus: null,
          toStatus: input.status,
          occurredAt: firstEventTime(input, user.timezone, now),
        },
      });

      return application;
    });

  try {
    return toApplication(await save());
  } catch (error) {
    // Two saves creating the same new company at the same moment: the unique index
    // lets one through and fails the other. The company exists now, so try once more.
    if (isUniqueViolation(error)) return toApplication(await save());
    throw error;
  }
}

/** The user's application with this id, or null (also when it belongs to someone else). */
export async function getApplication(
  db: Db,
  userId: string,
  applicationId: string,
): Promise<Application | null> {
  const row = await db.application.findFirst({
    where: { id: applicationId, userId },
    include: withCompany,
  });
  return row ? toApplication(row) : null;
}

/** One page of the user's applications, filtered, searched and sorted as asked. */
export async function listApplications(
  db: Db,
  userId: string,
  query: ListApplicationsQuery,
): Promise<{ items: ApplicationListItem[]; meta: PageMeta }> {
  const where: Prisma.ApplicationWhereInput = { userId };
  if (query.status) where.status = { in: query.status };
  if (query.search) {
    const contains = { contains: escapeLike(query.search), mode: 'insensitive' } as const;
    where.OR = [{ roleTitle: contains }, { company: { name: contains } }];
  }

  const [total, rows] = await Promise.all([
    db.application.count({ where }),
    db.application.findMany({
      where,
      orderBy: listOrder(query),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: withCompany,
      omit: listOmit,
    }),
  ]);

  return {
    items: rows.map(toApplicationListItem),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      // There is always a page 1, even an empty one.
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

/**
 * The ORDER BY for the list. The id comes last as a tie-breaker: without it, rows with
 * the same sort value can come back in any order, so paging could show one twice and
 * skip another. Ids are UUID v7, so they also follow the order the rows were added.
 */
function listOrder({
  sortBy,
  order,
}: ListApplicationsQuery): Prisma.ApplicationOrderByWithRelationInput[] {
  const tieBreaker = { id: order };
  switch (sortBy) {
    case 'appliedOn':
      // Saved jobs have no applied date. Postgres puts empty values first when sorting
      // newest first; they belong at the end either way.
      return [{ appliedOn: { sort: order, nulls: 'last' } }, tieBreaker];
    case 'company':
      // The normalized name is lowercase, so "acme" and "Beta" sort A–Z on any database.
      return [{ company: { normalizedName: order } }, tieBreaker];
    case 'createdAt':
    case 'updatedAt':
      return [{ [sortBy]: order }, tieBreaker];
  }
}

/**
 * Prisma's `contains` becomes SQL `ILIKE '%…%'` without escaping, so a search for
 * "100%" would also find "1000" (% = anything, _ = any one character). A backslash
 * makes the next character plain; Postgres uses it as LIKE's escape by default.
 */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&');
}

/**
 * When the first timeline event happened. Applied on an earlier day: noon of that day
 * in the user's timezone (we know the day, not the time). Otherwise: right now.
 */
function firstEventTime(input: CreateApplicationInput, timezone: string, now: Date): Date {
  if (
    input.status === 'APPLIED' &&
    input.appliedOn !== null &&
    input.appliedOn < todayIn(timezone, now)
  ) {
    return noonOn(input.appliedOn, timezone);
  }
  return now;
}

/** A database row → the shape the API sends (dates as strings, no user id). */
function toApplication(row: ApplicationRow): Application {
  return { ...toApplicationListItem(row), jobDescription: row.jobDescription };
}

function toApplicationListItem(row: ApplicationListRow): ApplicationListItem {
  return {
    id: row.id,
    status: row.status,
    roleTitle: row.roleTitle,
    company: row.company,
    appliedOn: row.appliedOn === null ? null : isoDateFrom(row.appliedOn),
    jobUrl: row.jobUrl,
    location: row.location,
    workMode: row.workMode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
