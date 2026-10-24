import { describe, expect, it } from 'vitest';
import { formatCalendarDate, todayInBrowser } from './dates';

describe('todayInBrowser', () => {
  it('gives the local date in the format date inputs use', () => {
    // Built from local parts, so this is 5 Mar in whatever timezone the tests run.
    expect(todayInBrowser(new Date(2026, 2, 5, 23, 30))).toBe('2026-03-05');
  });
});

describe('formatCalendarDate', () => {
  it('writes the date for people, in the given language', () => {
    expect(formatCalendarDate('2026-10-21', 'en-GB')).toBe('21 Oct 2026');
    expect(formatCalendarDate('2026-10-21', 'en-US')).toBe('Oct 21, 2026');
  });

  it('never shifts the day, even for the first and last day of a year', () => {
    expect(formatCalendarDate('2026-01-01', 'en-GB')).toBe('1 Jan 2026');
    expect(formatCalendarDate('2026-12-31', 'en-GB')).toBe('31 Dec 2026');
  });
});
