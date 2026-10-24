import { describe, expect, it } from 'vitest';
import { dateColumnFrom, isoDateFrom, noonOn, todayIn } from './dates';

describe('todayIn', () => {
  // 02:00 UTC on 23 Oct: morning of the 23rd in Kolkata, still evening of the 22nd in New York.
  const now = new Date('2026-10-23T02:00:00Z');

  it("gives the user's own date, not the server's", () => {
    expect(todayIn('Asia/Kolkata', now)).toBe('2026-10-23');
    expect(todayIn('America/New_York', now)).toBe('2026-10-22');
    expect(todayIn('UTC', now)).toBe('2026-10-23');
  });
});

describe('noonOn', () => {
  it('turns a date into noon in that timezone, as a UTC moment', () => {
    expect(noonOn('2026-10-07', 'Asia/Kolkata').toISOString()).toBe('2026-10-07T06:30:00.000Z');
  });

  it('follows daylight saving time', () => {
    // New York is UTC−4 in summer and UTC−5 in winter.
    expect(noonOn('2026-10-07', 'America/New_York').toISOString()).toBe('2026-10-07T16:00:00.000Z');
    expect(noonOn('2026-12-07', 'America/New_York').toISOString()).toBe('2026-12-07T17:00:00.000Z');
    // The days the clocks change (8 March and 1 November 2026).
    expect(noonOn('2026-03-08', 'America/New_York').toISOString()).toBe('2026-03-08T16:00:00.000Z');
    expect(noonOn('2026-11-01', 'America/New_York').toISOString()).toBe('2026-11-01T17:00:00.000Z');
  });
});

describe('DATE columns', () => {
  it('round-trip a calendar date without shifting it', () => {
    const column = dateColumnFrom('2026-10-07');

    expect(column.toISOString()).toBe('2026-10-07T00:00:00.000Z');
    expect(isoDateFrom(column)).toBe('2026-10-07');
  });

  it('refuse something that is not a calendar date', () => {
    expect(() => dateColumnFrom('7 Oct 2026')).toThrow('Not a calendar date');
  });
});
