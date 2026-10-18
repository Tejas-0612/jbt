import { z } from 'zod';

/**
 * Every setting the API reads from the environment, with its rules and default.
 * The API refuses to start if any value breaks these rules.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // 127.0.0.1 = reachable only from this machine. Hosting platforms set 0.0.0.0.
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Config = z.infer<typeof envSchema>;

/**
 * Validates the given environment (process.env by default) and returns typed settings.
 * Throws a readable error listing every invalid setting.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
