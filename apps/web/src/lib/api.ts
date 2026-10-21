import { apiErrorBodySchema, successEnvelopeSchema } from '@jbt/shared';
import type { z } from 'zod';

/** An error answer from the API, a failure to reach it, or an answer of the wrong shape. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * GETs an API endpoint, checks its answer against `dataSchema` (from @jbt/shared),
 * and returns the `data` part. Throws ApiError when:
 * - the server can't be reached                    → NETWORK_ERROR / API_UNREACHABLE
 * - the API answers with an error                  → the API's own code (e.g. NOT_FOUND)
 * - the answer doesn't match the expected shape    → INVALID_RESPONSE
 */
export async function getJson<S extends z.ZodType>(
  path: string,
  dataSchema: S,
): Promise<z.output<S>> {
  let response: Response;
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server.');
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = apiErrorBodySchema.safeParse(body);
    if (errorBody.success) {
      const { code, message } = errorBody.data.error;
      throw new ApiError(response.status, code, message);
    }
    // No JSON error: e.g. the dev proxy answers 502 when the API isn't running.
    throw new ApiError(response.status, 'API_UNREACHABLE', 'The API is not responding.');
  }

  // Runtime check, in two steps: the { data } wrapper, then the payload itself.
  // If the API and web app ever disagree about a shape, fail here with a clear
  // error instead of breaking somewhere deep in the UI.
  const envelope = successEnvelopeSchema.safeParse(body);
  const payload = envelope.success ? dataSchema.safeParse(envelope.data.data) : envelope;
  if (!payload.success) {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      `Unexpected answer from ${path}. The web app and API may be out of sync.`,
      { cause: payload.error },
    );
  }
  return payload.data;
}
