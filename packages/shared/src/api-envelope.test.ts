import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { apiErrorBody, apiErrorBodySchema, successEnvelopeSchema } from './api-envelope';

describe('apiErrorBody', () => {
  it('builds the agreed error shape', () => {
    expect(apiErrorBody('NOT_FOUND', 'Route GET /nope not found')).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /nope not found' },
    });
  });

  it('includes details only when given', () => {
    expect(
      apiErrorBody('VALIDATION_ERROR', 'Invalid request', { companyName: 'Required' }),
    ).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: { companyName: 'Required' },
      },
    });
  });

  it('produces bodies that the web app’s schema accepts', () => {
    expect(apiErrorBodySchema.safeParse(apiErrorBody('NOT_READY', 'x')).success).toBe(true);
  });
});

describe('apiErrorBodySchema', () => {
  it('accepts error codes it doesn’t know yet (lenient when receiving)', () => {
    const fromNewerApi = { error: { code: 'SOMETHING_NEW', message: 'Hi' } };
    expect(apiErrorBodySchema.safeParse(fromNewerApi).success).toBe(true);
  });

  it('rejects bodies that are not errors', () => {
    expect(apiErrorBodySchema.safeParse({ data: { status: 'ok' } }).success).toBe(false);
    expect(apiErrorBodySchema.safeParse('Internal Server Error').success).toBe(false);
  });
});

describe('successEnvelopeSchema', () => {
  it('accepts { data } with any payload (the endpoint schema checks the payload)', () => {
    expect(successEnvelopeSchema.parse({ data: { status: 'ok' } })).toEqual({
      data: { status: 'ok' },
    });
  });

  it('rejects answers without the { data } wrapper', () => {
    expect(successEnvelopeSchema.safeParse({ status: 'ok' }).success).toBe(false);
    expect(successEnvelopeSchema.safeParse(null).success).toBe(false);
  });

  it('works with an endpoint schema as the second step', () => {
    const payload = z.object({ status: z.literal('ok') });
    const envelope = successEnvelopeSchema.parse({ data: { status: 'up' } });
    expect(payload.safeParse(envelope.data).success).toBe(false);
  });
});
