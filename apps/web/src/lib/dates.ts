/*
 * Calendar dates ("2026-10-21") arrive from the API as plain strings. They have no
 * time and no timezone, so they must never pass through a local-time Date: in a
 * timezone behind UTC, "2026-10-21" read as UTC midnight is still the 20th.
 */

const pad = (value: number) => String(value).padStart(2, '0');

/** Today's date where the browser is, as "YYYY-MM-DD" (the format of <input type="date">). */
export function todayInBrowser(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * "2026-10-21" → "21 Oct 2026" (in the browser's language and order). Read and written
 * in UTC on purpose, so the day can't shift whatever the browser's timezone is.
 */
export function formatCalendarDate(date: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
