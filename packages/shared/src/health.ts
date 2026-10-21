import { z } from 'zod';

/** `data` of GET /health: the API process is up. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** `data` of GET /ready: the API can reach the database. */
export const readyResponseSchema = z.object({
  status: z.literal('ready'),
});
export type ReadyResponse = z.infer<typeof readyResponseSchema>;
