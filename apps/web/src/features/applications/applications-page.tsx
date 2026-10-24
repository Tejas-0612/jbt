import {
  BriefcaseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import type { ApplicationListItem, PageMeta } from '@jbt/shared';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { formatCalendarDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { useApplicationList } from './api';
import { CompanyAvatar } from './company-avatar';
import { STATUS_LABELS, WORK_MODE_LABELS } from './labels';
import { ListToolbar, type ChangeView } from './list-toolbar';
import { isFiltered, listViewParams, readListView, type ListView } from './list-view';
import { StatusBadge } from './status-badge';

/*
 * One markup for both layouts: cards on phones, table rows from md up. The columns on
 * md+: company, role, status, applied. On phones the status moves up next to the company.
 */
const ROW_COLUMNS = 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_9.5rem_8.5rem] md:gap-4 md:px-4';

/** Every application, with search, a status filter, sorting and pages. */
export function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = readListView(searchParams);
  const query = useApplicationList(listViewParams(view));

  // A new search, filter or sort starts at page 1. Only a page change scrolls to the top.
  const changeView: ChangeView = (changes, options) => {
    const next: ListView = { ...view, page: 1, ...changes };
    setSearchParams(new URLSearchParams(listViewParams(next)), {
      replace: options?.replace,
      preventScrollReset: changes.page === undefined,
    });
  };

  // Nothing to search or filter yet: the empty state alone says what to do.
  const nothingYet = query.data?.meta.total === 0 && !isFiltered(view) && !query.isPlaceholderData;

  return (
    <div className="flex max-w-5xl flex-col gap-6 py-6 md:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
      {!nothingYet && <ListToolbar view={view} onChange={changeView} />}
      <ListBody query={query} view={view} onChange={changeView} />
    </div>
  );
}

function ListBody({
  query,
  view,
  onChange,
}: {
  query: ReturnType<typeof useApplicationList>;
  view: ListView;
  onChange: ChangeView;
}) {
  // No data at all yet. (A failed background refresh keeps showing the last data.)
  if (!query.data) {
    return query.isError ? (
      <Message
        icon={<WarningCircleIcon aria-hidden weight="fill" className="size-10 text-warning" />}
        title="Couldn't load your applications"
        text="The server didn't answer. Check your connection, then try again."
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    ) : (
      <LoadingRows />
    );
  }

  const { items, meta } = query.data;

  if (meta.total === 0) {
    return isFiltered(view) ? (
      <Message
        icon={<MagnifyingGlassIcon aria-hidden className="size-10 text-muted-foreground" />}
        title="No applications match"
        text="Nothing matches this search and these filters."
        action={
          <Button variant="outline" onClick={() => onChange({ search: '', statuses: [] })}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <Message
        icon={<BriefcaseIcon aria-hidden className="size-10 text-muted-foreground" />}
        title="No applications yet"
        text="Add the jobs you have applied to, or ones worth saving. They'll all be here, each with its status."
        action={
          <Button asChild>
            <Link to="/applications/new">
              <PlusIcon aria-hidden />
              Add application
            </Link>
          </Button>
        }
      />
    );
  }

  // An old link, or the list got shorter since: the page asked for is past the end.
  if (items.length === 0) {
    return (
      <Message
        title="This page is empty"
        text={`The list has ${pluralize(meta.total, 'application')} on ${pluralize(meta.totalPages, 'page')}.`}
        action={
          <Button variant="outline" onClick={() => onChange({ page: meta.totalPages })}>
            Go to the last page
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* While the next page or search loads, the current rows stay, dimmed. */}
      <div
        aria-busy={query.isPlaceholderData}
        className={cn(
          'transition-opacity md:overflow-hidden md:rounded-lg md:border md:bg-card md:shadow-card',
          query.isPlaceholderData && 'opacity-60',
        )}
      >
        <div
          aria-hidden
          className={cn(
            'hidden h-10 items-center border-b bg-muted/40 text-small font-medium text-subtle-foreground md:grid',
            ROW_COLUMNS,
          )}
        >
          <span>Company</span>
          <span>Role</span>
          <span>Status</span>
          <span>Applied</span>
        </div>
        <ul aria-label="Applications" className="flex flex-col gap-3 md:gap-0">
          {items.map((application) => (
            <ApplicationRow key={application.id} application={application} />
          ))}
        </ul>
      </div>
      <Pagination meta={meta} shown={items.length} onPage={(page) => onChange({ page })} />
    </div>
  );
}

function ApplicationRow({ application }: { application: ApplicationListItem }) {
  const { id, company, roleTitle, status, appliedOn, location, workMode } = application;
  const where = [location, workMode && WORK_MODE_LABELS[workMode]].filter(Boolean).join(' · ');
  const applied = appliedOn ? `Applied ${formatCalendarDate(appliedOn)}` : 'Not applied yet';

  return (
    <li className="md:border-b md:last:border-b-0">
      <Link
        to={`/applications/${id}`}
        // Spelled out: a name built from the pieces inside runs them together
        // ("Acme CorpBackend Engineer…"). It starts with the visible company name.
        aria-label={[company.name, roleTitle, where, STATUS_LABELS[status], applied]
          .filter(Boolean)
          .join(', ')}
        className={cn(
          'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg border bg-card p-4 shadow-card transition-colors hover:bg-accent focus-visible:-outline-offset-2',
          'md:min-h-12 md:rounded-none md:border-0 md:py-2 md:shadow-none',
          ROW_COLUMNS,
        )}
      >
        <span className="order-1 flex min-w-0 items-center gap-3">
          <CompanyAvatar name={company.name} />
          <span className="truncate">{company.name}</span>
        </span>
        {/* pl-10 lines the text up with the company name, past the avatar (phones). */}
        <span className="order-3 col-span-2 min-w-0 pl-10 md:order-2 md:col-span-1 md:pl-0">
          <span className="block truncate font-medium">{roleTitle}</span>
          {where && (
            <span className="block truncate text-small text-muted-foreground">{where}</span>
          )}
        </span>
        <span className="order-2 md:order-3">
          <StatusBadge status={status} />
        </span>
        <span className="order-4 col-span-2 pl-10 text-small text-subtle-foreground tabular-nums md:col-span-1 md:pl-0 md:text-sm">
          {appliedOn ? (
            <>
              {/* The column header says it on md+; phones need the word. */}
              <span className="md:hidden">Applied </span>
              {formatCalendarDate(appliedOn)}
            </>
          ) : (
            'Not applied yet'
          )}
        </span>
      </Link>
    </li>
  );
}

function Pagination({
  meta,
  shown,
  onPage,
}: {
  meta: PageMeta;
  shown: number;
  onPage: (page: number) => void;
}) {
  const first = (meta.page - 1) * meta.pageSize + 1;
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3">
      <p aria-live="polite" className="text-small text-subtle-foreground tabular-nums">
        {meta.totalPages > 1
          ? `Showing ${first}–${first + shown - 1} of ${meta.total}`
          : pluralize(meta.total, 'application')}
      </p>
      {meta.totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => onPage(meta.page - 1)}
          >
            <CaretLeftIcon aria-hidden />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPage(meta.page + 1)}
          >
            Next
            <CaretRightIcon aria-hidden />
          </Button>
        </div>
      )}
    </nav>
  );
}

function LoadingRows() {
  return (
    <div role="status" className="flex flex-col gap-3 md:gap-2">
      <span className="sr-only">Loading applications…</span>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} aria-hidden className="h-20 animate-pulse rounded-lg bg-muted md:h-12" />
      ))}
    </div>
  );
}

function Message({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text: string;
  action: ReactNode;
}) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-lg border bg-card p-6 shadow-card">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-prose text-subtle-foreground">{text}</p>
      {action}
    </section>
  );
}

/** 1 → "1 application", 3 → "3 applications". */
function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
