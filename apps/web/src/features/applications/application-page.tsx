import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  CompassIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import type { Application } from '@jbt/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { formatCalendarDate } from '@/lib/dates';
import { useApplication } from './api';
import { WORK_MODE_LABELS } from './labels';
import { StatusBadge } from './status-badge';

/** The new-application form sends `{ justCreated: true }` along when it opens this page. */
function cameFromCreate(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'justCreated' in state;
}

/**
 * One application. Bare for now: tabs, Next steps and the timeline come in the
 * detail slice. Someone else's application gets the same "not found" as a missing one.
 */
export function ApplicationPage() {
  const { id = '' } = useParams();
  const query = useApplication(id);
  const location = useLocation();
  const navigate = useNavigate();

  // Show "Application saved" once: remember it, then drop it from the browser
  // history, so a reload doesn't announce it again.
  const [justCreated] = useState(() => cameFromCreate(location.state));
  useEffect(() => {
    if (justCreated) void navigate(location.pathname, { replace: true, state: null });
  }, [justCreated, navigate, location.pathname]);

  if (query.isPending) {
    return (
      <PageMessage
        icon={<CircleNotchIcon aria-hidden className="size-8 animate-spin text-muted-foreground" />}
        title="Loading the application…"
        role="status"
      />
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return notFound ? (
      <PageMessage
        icon={<CompassIcon aria-hidden className="size-10 text-muted-foreground" />}
        title="Application not found"
        text="It may have been deleted, or the link may be wrong."
        action={
          <Button asChild>
            <Link to="/">Go to the dashboard</Link>
          </Button>
        }
      />
    ) : (
      <PageMessage
        icon={<WarningCircleIcon aria-hidden weight="fill" className="size-10 text-warning" />}
        title="Couldn't load this application"
        text="The server didn't answer. Check your connection, then try again."
        action={
          <Button onClick={() => void query.refetch()} variant="outline">
            Try again
          </Button>
        }
      />
    );
  }

  return <ApplicationDetails application={query.data} justCreated={justCreated} />;
}

function ApplicationDetails({
  application,
  justCreated,
}: {
  application: Application;
  justCreated: boolean;
}) {
  const { roleTitle, company, status, appliedOn, location, workMode, jobUrl, jobDescription } =
    application;

  return (
    <div className="flex max-w-3xl flex-col gap-6 py-6 md:py-10">
      {justCreated && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm font-medium text-success"
        >
          <CheckCircleIcon aria-hidden weight="fill" className="size-4" />
          Application saved.
        </p>
      )}

      <article className="rounded-lg border bg-card p-5 shadow-card md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight break-words">{roleTitle}</h1>
            <p className="mt-1 text-subtle-foreground">{company.name}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Detail label="Applied on">
            {appliedOn ? formatCalendarDate(appliedOn) : 'Not applied yet'}
          </Detail>
          <Detail label="Location">{location ?? 'Not added'}</Detail>
          <Detail label="Work mode">{workMode ? WORK_MODE_LABELS[workMode] : 'Not added'}</Detail>
          <Detail label="Job link">
            {jobUrl ? (
              // Only http(s) links are ever stored (the shared rules), so this can't run code.
              <a
                href={jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
              >
                {linkLabel(jobUrl)}
                <ArrowSquareOutIcon aria-hidden className="size-4 shrink-0" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              'Not added'
            )}
          </Detail>
        </dl>
      </article>

      {jobDescription && (
        <section className="rounded-lg border bg-card p-5 shadow-card md:p-6">
          <h2 className="font-semibold">Job description</h2>
          <p className="mt-3 whitespace-pre-wrap text-foreground">{jobDescription}</p>
        </section>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-small text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

/** "https://jobs.example.com/42?ref=x" → "jobs.example.com": short and readable. */
function linkLabel(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function PageMessage({
  icon,
  title,
  text,
  action,
  role,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
  role?: 'status';
}) {
  return (
    <div role={role} className="mx-auto flex max-w-lg flex-col items-start gap-4 py-12">
      {icon}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {text && <p className="text-subtle-foreground">{text}</p>}
      {action}
    </div>
  );
}
