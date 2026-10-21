import { apiErrorBody, type ApiErrorCode } from '@jbt/shared';
import type { FastifyInstance } from 'fastify';

/** Machine-readable codes for errors Fastify itself raises (e.g. a malformed JSON body). */
const CODE_BY_STATUS: Partial<Record<number, ApiErrorCode>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  429: 'RATE_LIMITED',
};

/**
 * JavaScript can throw anything (`throw 'oops'`, `throw null`), so Fastify types
 * errors as `unknown`. These helpers check what was thrown before using it.
 */
function statusCodeOf(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const { statusCode } = error;
    if (typeof statusCode === 'number') return statusCode;
  }
  return 500;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Bad request';
}

/**
 * Makes every error response use the agreed envelope (built by the shared
 * `apiErrorBody`, so the web app reads exactly what the API sends):
 *   { "error": { "code": "NOT_FOUND", "message": "..." } }
 */
export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    return reply
      .code(404)
      .send(apiErrorBody('NOT_FOUND', `Route ${request.method} ${request.url} not found`));
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = statusCodeOf(error);

    // Unexpected failures: log everything, tell the client nothing internal.
    if (statusCode >= 500) {
      request.log.error({ err: error }, 'request failed');
      return reply
        .code(500)
        .send(apiErrorBody('INTERNAL_ERROR', 'Something went wrong. Please try again.'));
    }

    // Client mistakes (4xx): the message is safe to show.
    return reply
      .code(statusCode)
      .send(apiErrorBody(CODE_BY_STATUS[statusCode] ?? 'BAD_REQUEST', messageOf(error)));
  });
}
