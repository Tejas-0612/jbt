import {
  applicationListItemSchema,
  type Application,
  type ApplicationListItem,
  type Me,
  type PageMeta,
} from '@jbt/shared';

/** The signed-in user, as GET /api/v1/me sends it. */
export function sampleMe(overrides: Partial<Me> = {}): Me {
  return {
    id: '01a1639c-2848-72b2-b558-6ddb5d2b5a53',
    email: 'user-a@example.com',
    name: 'Sample User A',
    timezone: 'Asia/Kolkata',
    ...overrides,
  };
}

/** An application as the API sends it. Tests override what they care about. */
export function sampleApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: '01a164c6-786c-77f6-9e70-062cbfbebdc9',
    status: 'APPLIED',
    roleTitle: 'Backend Engineer',
    company: { id: '01a164c6-7854-7448-8bdd-8931a1f8bf2b', name: 'Acme Corp' },
    appliedOn: '2026-10-20',
    jobUrl: null,
    location: null,
    workMode: null,
    jobDescription: null,
    createdAt: '2026-10-22T18:01:30.988Z',
    updatedAt: '2026-10-22T18:01:30.988Z',
    ...overrides,
  };
}

/** A list item as GET /api/v1/applications sends it: no job description. */
export function sampleListItem(overrides: Partial<ApplicationListItem> = {}): ApplicationListItem {
  // The schema drops the fields a list item doesn't have.
  return applicationListItemSchema.parse({ ...sampleApplication(), ...overrides });
}

/** A whole list answer: these items, on page 1 of 1 unless `meta` says otherwise. */
export function sampleListPage(items: ApplicationListItem[], meta: Partial<PageMeta> = {}) {
  return {
    data: items,
    meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1, ...meta },
  };
}
