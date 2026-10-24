import type { Application, Me } from '@jbt/shared';

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
