import { describe, expect, it } from 'vitest';
import { APPLICATION_STATUSES, applicationStatusSchema } from './application-status';

describe('applicationStatusSchema', () => {
  it('accepts every agreed status', () => {
    for (const status of APPLICATION_STATUSES) {
      expect(applicationStatusSchema.parse(status)).toBe(status);
    }
  });

  it('rejects anything else, including wrong casing', () => {
    expect(applicationStatusSchema.safeParse('applied').success).toBe(false);
    expect(applicationStatusSchema.safeParse('RECRUITER_CONTACTED').success).toBe(false);
    expect(applicationStatusSchema.safeParse(undefined).success).toBe(false);
  });

  it('keeps the agreed pipeline order', () => {
    expect(APPLICATION_STATUSES).toEqual([
      'SAVED',
      'APPLIED',
      'SCREENING',
      'INTERVIEWING',
      'OFFER',
      'ACCEPTED',
      'REJECTED',
      'WITHDRAWN',
      'GHOSTED',
    ]);
  });
});
