import {
  APPLICATION_LIST_LIMITS,
  APPLICATION_STATUSES,
  DEFAULT_SORT_ORDER,
  type ApplicationSortField,
  type ApplicationStatus,
  type ListApplicationsParams,
  type SortOrder,
} from '@jbt/shared';

/*
 * What the Applications page shows (search, status filter, sort, page) lives in the
 * URL, e.g. /applications?search=acme&status=APPLIED,SCREENING&page=2, so a reload,
 * Back, or a link from elsewhere shows the same list. The parameter names are the
 * API's own.
 */

/** The sort choices offered on the page. The first one is the default. */
export const SORT_OPTIONS = [
  { value: 'updated', label: 'Last updated', sortBy: 'updatedAt', order: 'desc' },
  { value: 'applied-newest', label: 'Applied, newest first', sortBy: 'appliedOn', order: 'desc' },
  { value: 'applied-oldest', label: 'Applied, oldest first', sortBy: 'appliedOn', order: 'asc' },
  { value: 'added-newest', label: 'Added, newest first', sortBy: 'createdAt', order: 'desc' },
  { value: 'company', label: 'Company A–Z', sortBy: 'company', order: 'asc' },
] as const satisfies readonly {
  value: string;
  label: string;
  sortBy: ApplicationSortField;
  order: SortOrder;
}[];
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface ListView {
  search: string;
  statuses: ApplicationStatus[];
  sort: SortOption;
  page: number;
}

const DEFAULT_SORT = SORT_OPTIONS[0];

/**
 * URL → what to show. Lenient on purpose: a hand-edited or old link with a bad value
 * falls back to the default for that value instead of showing an error.
 */
export function readListView(params: URLSearchParams): ListView {
  const page = Number(params.get('page'));
  const sortBy = params.get('sortBy');
  const order = params.get('order') ?? (isSortField(sortBy) ? DEFAULT_SORT_ORDER[sortBy] : null);
  const listed = new Set(params.get('status')?.split(','));

  return {
    search: (params.get('search') ?? '').trim().slice(0, APPLICATION_LIST_LIMITS.search),
    // Known statuses only, in pipeline order.
    statuses: APPLICATION_STATUSES.filter((status) => listed.has(status)),
    sort:
      SORT_OPTIONS.find((option) => option.sortBy === sortBy && option.order === order) ??
      DEFAULT_SORT,
    page: Number.isInteger(page) && page >= 1 && page <= APPLICATION_LIST_LIMITS.maxPage ? page : 1,
  };
}

/** What to show → URL parameters. Defaults are left out, so the plain list is just /applications. */
export function listViewParams(view: ListView): ListApplicationsParams {
  const params: ListApplicationsParams = {};
  if (view.search) params.search = view.search;
  if (view.statuses.length > 0) params.status = view.statuses.join(',');
  if (view.sort !== DEFAULT_SORT) {
    params.sortBy = view.sort.sortBy;
    params.order = view.sort.order;
  }
  if (view.page > 1) params.page = String(view.page);
  return params;
}

/** True when a search or status filter hides some applications. */
export function isFiltered(view: ListView): boolean {
  return view.search !== '' || view.statuses.length > 0;
}

function isSortField(value: string | null): value is ApplicationSortField {
  return value !== null && value in DEFAULT_SORT_ORDER;
}
