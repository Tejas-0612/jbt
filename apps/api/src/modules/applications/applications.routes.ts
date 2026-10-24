import {
  apiErrorBody,
  createApplicationInputSchema,
  type Application,
  type ValidationErrorDetails,
} from '@jbt/shared';
import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';
import type { Db } from '../../db/client';
import { requireCurrentUser } from '../../http/current-user';
import { todayIn } from '../../lib/dates';
import { createApplication, getApplication } from './applications.service';

interface ApplicationRoutesOptions {
  db: Db;
}

/**
 * The HTTP side of applications: read the request, check it, call the service,
 * send the answer. Registered under /api/v1, after the current-user hook.
 */
export const applicationRoutes: FastifyPluginCallback<ApplicationRoutesOptions> = (
  app,
  { db },
  done,
) => {
  app.post('/applications', async (request, reply) => {
    const user = requireCurrentUser(request);

    // "Today" is the user's own date, so "not in the future" means their future.
    const input = createApplicationInputSchema(todayIn(user.timezone)).safeParse(request.body);
    if (!input.success) {
      const details = z.flattenError(input.error) satisfies ValidationErrorDetails;
      return reply
        .code(400)
        .send(apiErrorBody('VALIDATION_ERROR', 'Some fields need attention.', details));
    }

    const application = await createApplication(db, user, input.data);
    return reply.code(201).send({ data: application } satisfies { data: Application });
  });

  app.get<{ Params: { id: string } }>('/applications/:id', async (request, reply) => {
    const user = requireCurrentUser(request);

    // Not a valid id, someone else's, or deleted: all the same answer, so the API
    // never reveals whether another user's application exists.
    const id = z.uuid().safeParse(request.params.id);
    const application = id.success ? await getApplication(db, user.id, id.data) : null;
    if (!application) {
      return reply.code(404).send(apiErrorBody('NOT_FOUND', 'Application not found'));
    }
    return { data: application } satisfies { data: Application };
  });

  done();
};
