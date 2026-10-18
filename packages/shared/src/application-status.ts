/**
 * Every status an application can have, in pipeline order.
 * The database enum must contain exactly these values.
 */
export const APPLICATION_STATUSES = [
  'SAVED',
  'APPLIED',
  'SCREENING',
  'INTERVIEWING',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'GHOSTED',
] as const;

/** One of the values above, e.g. `'APPLIED'`. */
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
