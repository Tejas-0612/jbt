import { z } from 'zod';
import { APPLICATION_STATUSES, applicationStatusSchema } from './application-status';

/** Where the work happens. Optional on an application. */
export const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE'] as const;
export type WorkMode = (typeof WORK_MODES)[number];
export const workModeSchema = z.enum(WORK_MODES);

/** A calendar date with no time or timezone, e.g. "2026-10-22". Rejects 30 Feb. */
export const isoDateSchema = z.iso.date();

/** Longest accepted values. The form uses them too (e.g. as `maxLength`). */
export const APPLICATION_LIMITS = {
  companyName: 200,
  roleTitle: 200,
  location: 200,
  jobUrl: 2000,
  jobDescription: 50_000,
} as const;

const tooLong = (max: number) => `Use ${max.toLocaleString('en')} characters or fewer`;

/** Text the user must fill in: trimmed, not blank, not too long. */
function requiredText(max: number, missingMessage: string) {
  return z.string(missingMessage).trim().min(1, missingMessage).max(max, tooLong(max));
}

/** A form sends "" for an empty field. Blank or missing means "not given": null. */
function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Optional text, stored as null when blank. */
function optionalText(max: number) {
  return z
    .string()
    .nullish()
    .transform(blankToNull)
    .pipe(z.string().max(max, tooLong(max)).nullable());
}

/**
 * What the form sends to POST /api/v1/applications. `today` is the user's current
 * date ("2026-10-22"): the API passes today in the user's timezone, the form passes
 * the browser's today. Unknown fields are refused, so a client can't send `userId`.
 */
export function createApplicationInputSchema(today: string) {
  return z
    .strictObject({
      companyName: requiredText(APPLICATION_LIMITS.companyName, 'Add the company name'),
      roleTitle: requiredText(APPLICATION_LIMITS.roleTitle, 'Add the role'),
      status: z.enum(APPLICATION_STATUSES, 'Choose a status'),
      appliedOn: z
        .string()
        .nullish()
        .transform(blankToNull)
        .pipe(z.iso.date('Enter a real date, like 2026-10-22').nullable()),
      jobUrl: z
        .string()
        .nullish()
        .transform(blankToNull)
        .pipe(
          z
            .url({
              protocol: /^https?$/,
              error: 'Enter the full link, starting with http:// or https://',
            })
            .max(APPLICATION_LIMITS.jobUrl, tooLong(APPLICATION_LIMITS.jobUrl))
            .nullable(),
        ),
      location: optionalText(APPLICATION_LIMITS.location),
      // A dropdown left on "Not specified" sends "", which means not given, like blanks.
      workMode: z
        .string()
        .nullish()
        .transform(blankToNull)
        .pipe(z.enum(WORK_MODES, 'Choose Remote, Hybrid or Onsite').nullable()),
      jobDescription: optionalText(APPLICATION_LIMITS.jobDescription),
    })
    .superRefine(({ status, appliedOn }, ctx) => {
      const issue = (message: string) =>
        ctx.addIssue({ code: 'custom', path: ['appliedOn'], message });
      if (status === 'SAVED') {
        if (appliedOn !== null) {
          issue('A saved job has no applied date yet. Clear the date or change the status');
        }
      } else if (appliedOn === null) {
        issue('Add the date you applied');
      } else if (isoDateSchema.safeParse(appliedOn).success && appliedOn > today) {
        // (An invalid date already has its own message above.)
        // "YYYY-MM-DD" strings sort like the dates they stand for.
        issue("The applied date can't be in the future");
      }
    });
}

/** The fields as the form fills them in (before blanks become null). */
export type CreateApplicationFormValues = z.input<ReturnType<typeof createApplicationInputSchema>>;
/** The checked, cleaned-up input the API works with. */
export type CreateApplicationInput = z.output<ReturnType<typeof createApplicationInputSchema>>;

/** `data` of POST /api/v1/applications and GET /api/v1/applications/:id. */
export const applicationSchema = z.object({
  id: z.uuid(),
  status: applicationStatusSchema,
  roleTitle: z.string(),
  company: z.object({ id: z.uuid(), name: z.string() }),
  appliedOn: isoDateSchema.nullable(),
  jobUrl: z.string().nullable(),
  location: z.string().nullable(),
  workMode: workModeSchema.nullable(),
  jobDescription: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Application = z.infer<typeof applicationSchema>;
