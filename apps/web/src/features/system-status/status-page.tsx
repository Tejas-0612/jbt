import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { healthResponseSchema, readyResponseSchema } from '@jbt/shared';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getJson } from '@/lib/api';

/*
 * TEMPORARY development page: proves the whole chain works
 * (browser → Vite proxy → API → database) and shows the Harbor Slate styling.
 * Replaced by the real dashboard in slice 1.
 */

type CheckState = 'checking' | 'ok' | 'problem';

/** "ok" only when the answer actually says what we expect, not just "HTTP 200". */
function stateOf(isPending: boolean, answerIsGood: boolean): CheckState {
  if (isPending) return 'checking';
  return answerIsGood ? 'ok' : 'problem';
}

function StateIcon({ state }: { state: CheckState }) {
  // The text next to the icon always says the same thing, so colour never carries
  // meaning alone (the icon is hidden from screen readers).
  if (state === 'checking') {
    return <CircleNotchIcon aria-hidden className="size-5 animate-spin text-muted-foreground" />;
  }
  if (state === 'ok') {
    return <CheckCircleIcon aria-hidden weight="fill" className="size-5 text-success" />;
  }
  return <WarningCircleIcon aria-hidden weight="fill" className="size-5 text-warning" />;
}

function StatusRow({ label, state, detail }: { label: string; state: CheckState; detail: string }) {
  return (
    <li className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <span className="mt-0.5">
        <StateIcon state={state} />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="text-small text-subtle-foreground">{detail}</p>
      </div>
    </li>
  );
}

export function StatusPage() {
  // The shared schemas both type the answers and check them at runtime.
  const health = useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => getJson('/health', healthResponseSchema),
    retry: false,
  });
  const ready = useQuery({
    queryKey: ['system', 'ready'],
    queryFn: () => getJson('/ready', readyResponseSchema),
    retry: false,
  });

  const apiState = stateOf(health.isPending, health.data?.status === 'ok');
  const databaseState = stateOf(ready.isPending, ready.data?.status === 'ready');

  const apiDetail = {
    checking: 'Checking…',
    ok: 'Running',
    problem: 'Not responding. Is it running? (pnpm dev)',
  }[apiState];

  let databaseDetail = {
    checking: 'Checking…',
    ok: 'Ready',
    problem: 'Not reachable. Is Docker running? (pnpm docker:up)',
  }[databaseState];
  if (databaseState === 'problem' && apiState === 'problem') {
    databaseDetail = 'Unknown while the API is down';
  }

  const isChecking = health.isFetching || ready.isFetching;

  function checkAgain() {
    void health.refetch();
    void ready.refetch();
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm font-bold text-brand-deep">Job Tracker</p>
        <h1 className="font-display text-display font-medium tracking-[-0.01em]">System status</h1>
        <p className="text-subtle-foreground">
          A temporary development page. It checks that the web app, the API and the database can all
          talk to each other.
        </p>
      </header>

      {/* aria-live: screen readers announce the results when they change. */}
      <section
        aria-label="Checks"
        aria-live="polite"
        className="rounded-lg border bg-card p-6 shadow-card"
      >
        <ul className="divide-y">
          <StatusRow label="API" state={apiState} detail={apiDetail} />
          <StatusRow label="Database" state={databaseState} detail={databaseDetail} />
        </ul>
      </section>

      <div>
        <Button onClick={checkAgain} disabled={isChecking}>
          <ArrowClockwiseIcon
            aria-hidden
            data-icon="inline-start"
            className={isChecking ? 'animate-spin' : undefined}
          />
          Check again
        </Button>
      </div>
    </main>
  );
}
