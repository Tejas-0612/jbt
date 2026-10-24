import { z } from 'zod';

// A setting that may be left out. A blank value in .env (`GOOGLE_CLIENT_ID=`) counts as left out.
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

/**
 * Every setting the API reads from the environment, with its rules and default.
 * The API refuses to start if any value breaks these rules.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // 127.0.0.1 = reachable only from this machine. Hosting platforms set 0.0.0.0.
    HOST: z.string().min(1).default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    // Required, no default: e.g. postgresql://user:password@localhost:5433/jbt_dev
    // Contains a password, so never log it.
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    // Where the web app runs: scheme, host and port, nothing after. Sign-in sends the
    // browser back here, and POST/PATCH/DELETE requests must say they come from here.
    WEB_ORIGIN: z
      .url({ protocol: /^https?$/ })
      .default('http://localhost:5173')
      .refine((url) => URL.canParse(url) && new URL(url).origin === url, {
        message: 'Must be an origin like http://localhost:5173 (no path, no trailing slash)',
      }),
    // From Google Cloud Console (README: "Sign in with Google"). Optional outside
    // production: without them the dev login still works, and "Continue with Google"
    // says sign-in isn't set up. The secret goes only in .env: never in git or logs.
    GOOGLE_CLIENT_ID: optionalText,
    GOOGLE_CLIENT_SECRET: optionalText,
  })
  .superRefine((env, ctx) => {
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({
        code: 'custom',
        path: [env.GOOGLE_CLIENT_ID ? 'GOOGLE_CLIENT_SECRET' : 'GOOGLE_CLIENT_ID'],
        message: 'Set both Google settings, or neither',
      });
    }
    if (env.NODE_ENV !== 'production') return;
    if (!env.GOOGLE_CLIENT_ID) {
      ctx.addIssue({
        code: 'custom',
        path: ['GOOGLE_CLIENT_ID'],
        message: 'Required in production',
      });
    }
    // Cookies are Secure in production: over plain http the browser would drop them.
    if (!env.WEB_ORIGIN.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['WEB_ORIGIN'],
        message: 'Must be https in production',
      });
    }
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
