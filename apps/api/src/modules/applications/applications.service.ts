import type { Application, CreateApplicationInput } from '@jbt/shared';
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
  return {
    id: row.id,
    status: row.status,
    roleTitle: row.roleTitle,
    company: row.company,
    appliedOn: row.appliedOn === null ? null : isoDateFrom(row.appliedOn),
    jobUrl: row.jobUrl,
    location: row.location,
    workMode: row.workMode,
    jobDescription: row.jobDescription,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
