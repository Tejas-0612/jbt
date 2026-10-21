import { z } from 'zod';

/*
 * The shape of every API answer, shared by the API (which builds it) and the
 * web app (which reads it):
 *   success: { "data": ... }
 *   failure: { "error": { "code": "NOT_FOUND", "message": "...", "details": ... } }
 */

/** Every error code the API may send. The web app can rely on these names. */
export const API_ERROR_CODES = [
  'BAD_REQUEST',
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'NOT_READY',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; details?: unknown };
}

/** Builds an error answer. Used by the API, so a misspelled code fails to compile. */
export function apiErrorBody(code: ApiErrorCode, message: string, details?: unknown): ApiErrorBody {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

/**
 * Reads an error answer. Used by the web app. The code is accepted as any string
 * (not just the list above), so an API that adds a new code doesn't break older
 * web app versions: strict when sending, lenient when receiving.
 */
export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

/**
 * The outer success shape `{ data: ... }`. Callers then check `data` with the
 * endpoint's own schema (two steps instead of one generic `z.object({ data: T })`,
 * because TypeScript can't type the generic version without a cast).
 */
export const successEnvelopeSchema = z.object({ data: z.unknown() });
