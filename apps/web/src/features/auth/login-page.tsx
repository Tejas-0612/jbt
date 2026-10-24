import { SIGN_IN_ERRORS, type SignInError } from '@jbt/shared';
import { CircleNotchIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { Wordmark } from '@/components/wordmark';
import { Button } from '@/components/ui/button';
import { googleSignInHref, safeReturnTo, useDevLogin, useMe } from './api';

/** What each ?error= code from the API means, for people. */
const ERROR_MESSAGES: Record<SignInError, string> = {
  cancelled: 'Sign-in was cancelled. Try again whenever you like.',
  expired: 'That sign-in took too long, or was started in another browser. Please try again.',
  failed: "Couldn't finish signing in with Google. Please try again in a moment.",
  unverified_email:
    "Google hasn't verified that account's email address. Verify it with Google, or use another account.",
  not_configured:
    'Sign-in with Google isn\'t set up on this server yet. The README explains how ("Sign in with Google").',
};

function isSignInError(value: string | null): value is SignInError {
  return SIGN_IN_ERRORS.some((code) => code === value);
}

/** The sign-in page, outside the app's frame: the only page you can see signed out. */
export function LoginPage() {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo'));
  const error = params.get('error');
  const me = useMe();

  // Already signed in (e.g. Back after signing in): go where sign-in would have gone.
  if (me.isSuccess) return <Navigate to={returnTo} replace />;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <main className="flex w-full max-w-sm flex-col gap-6 rounded-lg border bg-card p-6 shadow-card md:p-8">
        <Wordmark />
        <div>
          <h1 className="font-display text-display font-medium tracking-[-0.01em]">Sign in</h1>
          <p className="mt-2 text-subtle-foreground">
            Every application in one place, and always a clear next step.
          </p>
        </div>

        {error !== null && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <WarningCircleIcon aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0" />
            {isSignInError(error) ? ERROR_MESSAGES[error] : ERROR_MESSAGES.failed}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" size="lg">
            <a href={googleSignInHref(returnTo)}>
              <GoogleLogo />
              Continue with Google
            </a>
          </Button>
          <p className="text-small text-muted-foreground">
            We only ask Google for your name and email address.
          </p>
        </div>

        {import.meta.env.DEV && <DevSignIn returnTo={returnTo} />}
      </main>
    </div>
  );
}

/** Development only (never in a production build): sign in as a sample user, no Google needed. */
function DevSignIn({ returnTo }: { returnTo: string }) {
  const devLogin = useDevLogin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function signInAs(user: 'a' | 'b') {
    try {
      await devLogin.mutateAsync({ user });
    } catch {
      return; // shown below
    }
    // Nothing cached from before belongs to this user.
    queryClient.clear();
    await navigate(returnTo, { replace: true });
  }

  return (
    <section aria-labelledby="dev-sign-in" className="flex flex-col gap-2 border-t pt-5">
      <h2 id="dev-sign-in" className="text-small font-medium text-subtle-foreground">
        Development only
      </h2>
      <div className="flex flex-wrap gap-2">
        {(['a', 'b'] as const).map((user) => (
          <Button
            key={user}
            variant="secondary"
            disabled={devLogin.isPending}
            onClick={() => void signInAs(user)}
          >
            {devLogin.isPending && devLogin.variables.user === user && (
              <CircleNotchIcon aria-hidden className="animate-spin" />
            )}
            Sign in as Sample User {user.toUpperCase()}
          </Button>
        ))}
      </div>
      {devLogin.isError && (
        <p role="alert" className="text-small text-destructive">
          Couldn&apos;t sign in: {devLogin.error.message}
        </p>
      )}
    </section>
  );
}

/** Google's "G", as its sign-in branding guidelines ask for on a sign-in button. */
function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-[18px]">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
