import { z } from 'zod';
import { applicationSchema } from './application';
import { APPLICATION_STATUSES } from './application-status';

/** What the list can be sorted by. `company` is the company name. */
export const APPLICATION_SORT_FIELDS = ['updatedAt', 'appliedOn', 'createdAt', 'company'] as const;
export type ApplicationSortField = (typeof APPLICATION_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/** The order used when the request gives none: names A–Z, dates newest first. */
export const DEFAULT_SORT_ORDER = {
  updatedAt: 'desc',
  appliedOn: 'desc',
  createdAt: 'desc',
  company: 'asc',
} as const satisfies Record<ApplicationSortField, SortOrder>;

export const APPLICATION_LIST_LIMITS = {
  defaultPageSize: 20,
  maxPageSize: 100,
  // Far more pages than anyone has; it keeps the database offset a small number.
  maxPage: 10_000,
  search: 200,
} as const;

/**
 * A whole number from the URL: "2" → 2. Checked by hand because z.coerce.number()
 * turns "" into 0 and also accepts " 2", "1e3" and "0x10".
 */
function wholeNumber(max: number) {
  const message = `Use a whole number from 1 to ${max.toLocaleString('en')}`;
  return z
    .string(message)
    .regex(/^[1-9]\d*$/, message)
    .transform(Number)
    .pipe(z.number().max(max, message));
}

/** A blank or missing text filter means "no filter". */
const blankToUndefined = (value: string | undefined) => value?.trim() || undefined;

/**
 * The query of GET /api/v1/applications, e.g.
 * `?search=acme&status=APPLIED,SCREENING&sortBy=appliedOn&order=asc&page=2`.
 * Every parameter is optional. Unknown parameters are refused, and sort fields come
 * from the fixed list above, never straight from the URL.
 */
export const listApplicationsQuerySchema = z
  .strictObject({
    page: wholeNumber(APPLICATION_LIST_LIMITS.maxPage).default(1),
    pageSize: wholeNumber(APPLICATION_LIST_LIMITS.maxPageSize).default(
      APPLICATION_LIST_LIMITS.defaultPageSize,
    ),
    // Part of the company name or role, any case.
    search: z
      .string()
      .optional()
      .transform(blankToUndefined)
      .pipe(
        z
          .string()
          .max(
            APPLICATION_LIST_LIMITS.search,
            `Use ${APPLICATION_LIST_LIMITS.search} characters or fewer`,
          )
          .optional(),
      ),
    // One status or several, separated by commas.
    status: z
      .string()
      .optional()
      .transform((value) =>
        blankToUndefined(value)
          ?.split(',')
          .map((status) => status.trim()),
      )
      .pipe(
        z
          .array(z.enum(APPLICATION_STATUSES, `Use one of ${APPLICATION_STATUSES.join(', ')}`))
          .optional(),
      ),
    sortBy: z
      .enum(APPLICATION_SORT_FIELDS, `Sort by one of ${APPLICATION_SORT_FIELDS.join(', ')}`)
      .default('updatedAt'),
    order: z.enum(SORT_ORDERS, 'Use asc or desc').optional(),
  })
  .transform(({ order, ...query }) => ({
    ...query,
    order: order ?? DEFAULT_SORT_ORDER[query.sortBy],
  }));

/** The URL parameters as a client writes them: all strings, all optional. */
export type ListApplicationsParams = z.input<typeof listApplicationsQuerySchema>;
/** The checked query the API works with, defaults filled in. */
export type ListApplicationsQuery = z.output<typeof listApplicationsQuerySchema>;

/**
 * One item of GET /api/v1/applications: the application without its job description,
 * which can be 50,000 characters and isn't shown in the list.
 */
export const applicationListItemSchema = applicationSchema.omit({ jobDescription: true });
export type ApplicationListItem = z.infer<typeof applicationListItemSchema>;
