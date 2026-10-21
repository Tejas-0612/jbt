/** An error answer from the API, or a failure to reach it at all. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** The API's error shape: { "error": { "code": "NOT_FOUND", "message": "..." } } */
interface ErrorEnvelope {
  error: { code: string; message: string };
}

function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  if (typeof body !== 'object' || body === null || !('error' in body)) return false;
  const { error } = body;
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

/**
 * GETs an API endpoint and returns the `data` part of its `{ data }` answer.
 * Throws ApiError for error answers and when the API can't be reached.
 */
export async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server.');
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isErrorEnvelope(body)) {
      throw new ApiError(response.status, body.error.code, body.error.message);
    }
    // No JSON error: e.g. the dev proxy answers 500 when the API isn't running.
    throw new ApiError(response.status, 'API_UNREACHABLE', 'The API is not responding.');
  }

  return (body as { data: T }).data;
}
