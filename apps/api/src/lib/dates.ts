import { TZDate } from '@date-fns/tz';

/*
 * Two kinds of time, kept apart on purpose:
 * - a calendar date ("2026-10-22"): no time, no timezone. Sent to and from the
 *   browser as that plain string, never as a Date, so it can't shift by a day.
 * - a moment (a Date): stored in UTC, shown in the user's timezone.
 * Converting between them needs the user's timezone, which is what these do.
 */

const pad = (value: number) => String(value).padStart(2, '0');

/** Today's date in a timezone, e.g. "2026-10-23" in Kolkata while it's still the 22nd in New York. */
export function todayIn(timezone: string, now: Date = new Date()): string {
  const local = new TZDate(now.getTime(), timezone);
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}

/**
 * Noon of a date in a timezone, as a moment: "2026-10-07" in Kolkata → 06:30 UTC.
 * Used when we know the day something happened but not the time. Noon, not midnight:
 * it stays on the same date if the user's timezone setting changes later, and it
 * always exists (some places skip midnight when daylight saving starts).
 */
export function noonOn(date: string, timezone: string): Date {
  const [year, month, day] = parseIsoDate(date);
  return new Date(new TZDate(year, month - 1, day, 12, 0, 0, timezone).getTime());
}

/** For a DATE column: Prisma reads and writes it as a Date at UTC midnight. */
export function dateColumnFrom(date: string): Date {
  parseIsoDate(date);
  return new Date(`${date}T00:00:00.000Z`);
}

/** The "YYYY-MM-DD" in a DATE column's value (UTC midnight, see above). */
export function isoDateFrom(dateColumn: Date): string {
  return dateColumn.toISOString().slice(0, 10);
}

function parseIsoDate(date: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Not a calendar date: "${date}"`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** True for a timezone name this runtime knows, e.g. "Asia/Kolkata" or "UTC". */
export function isValidTimeZone(timezone: string): boolean {
  if (timezone.length > 64) return false;
  try {
    // Throws a RangeError for a name it doesn't know.
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
