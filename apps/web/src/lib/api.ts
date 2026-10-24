import {
  apiErrorBodySchema,
  pageEnvelopeSchema,
  successEnvelopeSchema,
  type PageMeta,
} from '@jbt/shared';
import { z } from 'zod';

/** An error answer from the API, a failure to reach it, or an answer of the wrong shape. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Extra information from the API, e.g. the per-field messages of a VALIDATION_ERROR. */
  readonly details: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * GETs an API endpoint, checks its answer against `dataSchema` (from @jbt/shared),
 * and returns the `data` part. Throws ApiError when:
 * - the server can't be reached                    → NETWORK_ERROR / API_UNREACHABLE
 * - the API answers with an error                  → the API's own code (e.g. NOT_FOUND)
 * - the answer doesn't match the expected shape    → INVALID_RESPONSE
 */
export function getJson<S extends z.ZodType>(path: string, dataSchema: S): Promise<z.output<S>> {
  return requestJson(path, { headers: { Accept: 'application/json' } }, dataSchema);
}

/** One page of a list: its items and where it sits in the whole list. */
export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

/**
 * GETs a list endpoint (`{ data: [...], meta }`) and checks every item against
 * `itemSchema`. Same errors as `getJson`.
 */
export async function getPage<S extends z.ZodType>(
  path: string,
  itemSchema: S,
): Promise<Page<z.output<S>>> {
  const { status, body } = await receiveJson(path, { headers: { Accept: 'application/json' } });
  const envelope = expectShape(path, status, pageEnvelopeSchema, body);
  return {
    items: expectShape(path, status, z.array(itemSchema), envelope.data),
    meta: envelope.meta,
  };
}

/** POSTs `body` as JSON. Same answer checks and errors as `getJson`. */
export function postJson<S extends z.ZodType>(
  path: string,
  body: unknown,
  dataSchema: S,
): Promise<z.output<S>> {
  return requestJson(
    path,
    {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    dataSchema,
  );
}

/** POSTs to an endpoint that answers 204 No Content (e.g. sign out). Same errors as `postJson`. */
export async function postNoContent(path: string, body?: unknown): Promise<void> {
  const response = await send(path, {
    method: 'POST',
    headers:
      body === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw errorFrom(response, await response.json().catch(() => null));
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server.');
  }
}

function errorFrom(response: Response, body: unknown): ApiError {
  const errorBody = apiErrorBodySchema.safeParse(body);
  if (errorBody.success) {
    const { code, message, details } = errorBody.data.error;
    return new ApiError(response.status, code, message, details);
  }
  // No JSON error: e.g. the dev proxy answers 502 when the API isn't running.
  return new ApiError(response.status, 'API_UNREACHABLE', 'The API is not responding.');
}

async function requestJson<S extends z.ZodType>(
  path: string,
  init: RequestInit,
  dataSchema: S,
): Promise<z.output<S>> {
  const { status, body } = await receiveJson(path, init);
  // Runtime check, in two steps: the { data } wrapper, then the payload itself.
  const envelope = expectShape(path, status, successEnvelopeSchema, body);
  return expectShape(path, status, dataSchema, envelope.data);
}

/** Sends the request and reads the JSON answer. Throws ApiError for an error answer. */
async function receiveJson(
  path: string,
  init: RequestInit,
): Promise<{ status: number; body: unknown }> {
  const response = await send(path, init);
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw errorFrom(response, body);
  return { status: response.status, body };
}

/**
 * If the API and web app ever disagree about a shape, fail here with a clear error
 * instead of breaking somewhere deep in the UI.
 */
function expectShape<S extends z.ZodType>(
  path: string,
  status: number,
  schema: S,
  value: unknown,
): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(
      status,
      'INVALID_RESPONSE',
      `Unexpected answer from ${path}. The web app and API may be out of sync.`,
      undefined,
      { cause: result.error },
    );
  }
  return result.data;
}
