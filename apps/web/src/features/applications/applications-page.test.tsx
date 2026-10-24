import { apiErrorBody } from '@jbt/shared';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import type { createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { formatCalendarDate } from '@/lib/dates';
import { sampleApplication, sampleListItem, sampleListPage } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = '/api/v1/applications';

const acme = sampleListItem({
  id: crypto.randomUUID(),
  roleTitle: 'Backend Engineer',
  company: { id: crypto.randomUUID(), name: 'Acme Corp' },
  status: 'SCREENING',
  appliedOn: '2026-10-20',
  location: 'Pune',
  workMode: 'HYBRID',
});
const globex = sampleListItem({
  id: crypto.randomUUID(),
  roleTitle: 'Frontend Developer',
  company: { id: crypto.randomUUID(), name: 'Globex' },
  status: 'SAVED',
  appliedOn: null,
});

/** Fakes the list endpoint with `respond`, and records the query of every request. */
function answerList(respond: (params: URLSearchParams) => Response | Promise<Response>) {
  const asked: URLSearchParams[] = [];
  server.use(
    http.get(API, ({ request }) => {
      const params = new URL(request.url).searchParams;
      asked.push(params);
      return respond(params);
    }),
  );
  return asked;
}

/** The detail page's answer, for tests that open an application from the list. */
function answerDetail() {
  server.use(
    http.get(`${API}/${acme.id}`, () =>
      HttpResponse.json({ data: sampleApplication({ ...acme, jobDescription: null }) }),
    ),
  );
}

/** What the address bar would show after `?`. */
const urlParams = (router: ReturnType<typeof createMemoryRouter>) =>
  new URLSearchParams(router.state.location.search);

const rowFor = (company: string) => screen.findByRole('link', { name: new RegExp(company) });

function openList(path = '/applications') {
  const user = userEvent.setup();
  return { user, ...renderApp({ path }) };
}

describe('Applications page', () => {
  it('lists each application with its company, role, status and date, and opens it', async () => {
    answerList(() => HttpResponse.json(sampleListPage([acme, globex])));
    answerDetail();
    const { user, router } = openList('/');

    // Reached from the main navigation (the sidebar's link comes first).
    await user.click(screen.getAllByRole('link', { name: 'Applications' })[0]!);

    const row = await rowFor('Acme Corp');
    expect(row).toHaveTextContent('Backend Engineer');
    expect(row).toHaveTextContent('Pune · Hybrid');
    expect(row).toHaveTextContent('Screening');
    expect(row).toHaveTextContent(`Applied ${formatCalendarDate('2026-10-20')}`);
    expect(await rowFor('Globex')).toHaveTextContent('Not applied yet');
    expect(screen.getByText('2 applications')).toBeInTheDocument();

    await user.click(row);

    expect(await screen.findByRole('heading', { name: 'Backend Engineer' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/applications/${acme.id}`);
  });

  it('shows placeholder rows while loading', async () => {
    answerList(async () => {
      await delay('infinite');
      return HttpResponse.json(sampleListPage([]));
    });
    openList();

    expect(await screen.findByRole('status')).toHaveTextContent('Loading applications…');
  });

  it('invites you to add the first application, with nothing to search yet', async () => {
    answerList(() => HttpResponse.json(sampleListPage([])));
    openList();

    expect(await screen.findByRole('heading', { name: 'No applications yet' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('says when nothing matches, and Clear filters shows everything again', async () => {
    answerList((params) => HttpResponse.json(sampleListPage(params.has('search') ? [] : [acme])));
    const { user, router } = openList('/applications?search=zzz&status=REJECTED');

    expect(
      await screen.findByRole('heading', { name: 'No applications match' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search applications' })).toHaveValue('zzz');
    expect(screen.getByRole('button', { name: 'Remove the Rejected filter' })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]!);

    expect(await rowFor('Acme Corp')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search applications' })).toHaveValue('');
    expect(router.state.location.search).toBe('');
  });

  it('shows an error, and Try again loads the list', async () => {
    let down = true;
    answerList(() =>
      down
        ? HttpResponse.json(apiErrorBody('INTERNAL_ERROR', 'Something went wrong'), {
            status: 500,
          })
        : HttpResponse.json(sampleListPage([acme])),
    );
    const { user } = openList();

    expect(
      await screen.findByRole('heading', { name: "Couldn't load your applications" }),
    ).toBeInTheDocument();
    down = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await rowFor('Acme Corp')).toBeInTheDocument();
  });

  it('searches once typing pauses, keeps the search in the URL, and Back skips the letters', async () => {
    const asked = answerList((params) =>
      HttpResponse.json(sampleListPage(params.get('search') === 'acme' ? [acme] : [acme, globex])),
    );
    const { user, router } = openList('/');
    await user.click(screen.getAllByRole('link', { name: 'Applications' })[0]!);
    await rowFor('Globex');

    await user.type(screen.getByRole('searchbox', { name: 'Search applications' }), 'acme');

    await waitFor(() => expect(screen.queryByText('Globex')).not.toBeInTheDocument());
    // One request for the whole word, not one per letter.
    expect(asked.map((params) => params.get('search'))).toEqual([null, 'acme']);
    expect(urlParams(router).get('search')).toBe('acme');

    await act(() => router.navigate(-1));
    expect(router.state.location.pathname).toBe('/');
  });

  it('filters by one or more statuses, with chips that remove a filter', async () => {
    const asked = answerList(() => HttpResponse.json(sampleListPage([acme])));
    const { user, router } = openList();
    await rowFor('Acme Corp');

    await user.click(screen.getByRole('button', { name: 'Status' }));
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Offer' }));
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Screening' }));
    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Status (2 selected)' })).toBeInTheDocument();
    // In pipeline order, whatever order they were picked in.
    expect(urlParams(router).get('status')).toBe('SCREENING,OFFER');
    await waitFor(() => expect(asked.at(-1)?.get('status')).toBe('SCREENING,OFFER'));

    await user.click(screen.getByRole('button', { name: 'Remove the Screening filter' }));

    // (No new request: "Offer" alone was fetched a moment ago, after the first pick.)
    expect(urlParams(router).get('status')).toBe('OFFER');
    expect(screen.queryByRole('button', { name: 'Remove the Screening filter' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove the Offer filter' })).toBeInTheDocument();
  });

  it('sorts in the chosen order', async () => {
    const asked = answerList(() => HttpResponse.json(sampleListPage([acme])));
    const { user } = openList();
    await rowFor('Acme Corp');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), 'Company A–Z');

    await waitFor(() => expect(asked.at(-1)?.get('sortBy')).toBe('company'));
    expect(asked.at(-1)?.get('order')).toBe('asc');
  });

  it('pages through with Previous and Next, and a new sort starts again at page 1', async () => {
    const items = Array.from({ length: 45 }, (_, i) =>
      sampleListItem({ id: crypto.randomUUID(), roleTitle: `Role ${i + 1}` }),
    );
    answerList((params) => {
      const page = Number(params.get('page') ?? 1);
      return HttpResponse.json(
        sampleListPage(items.slice((page - 1) * 20, page * 20), { page, total: 45, totalPages: 3 }),
      );
    });
    const { user, router } = openList();

    expect(await screen.findByText('Showing 1–20 of 45')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 21–40 of 45')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 41–45 of 45')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(urlParams(router).get('page')).toBe('3');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), 'Company A–Z');
    expect(urlParams(router).get('page')).toBeNull();
  });

  it('returns to the same filtered list after opening an application', async () => {
    answerList(() => HttpResponse.json(sampleListPage([acme])));
    answerDetail();
    const { user, router } = openList('/applications?status=SCREENING');

    await user.click(await rowFor('Acme Corp'));
    await screen.findByRole('heading', { name: 'Backend Engineer' });
    await act(() => router.navigate(-1));

    expect(
      await screen.findByRole('button', { name: 'Remove the Screening filter' }),
    ).toBeInTheDocument();
    expect(await rowFor('Acme Corp')).toBeInTheDocument();
  });

  it('offers the last page when the page asked for is past the end', async () => {
    answerList((params) =>
      HttpResponse.json(
        params.get('page') === '9'
          ? sampleListPage([], { page: 9, total: 25, totalPages: 2 })
          : sampleListPage([acme], { page: 2, total: 25, totalPages: 2 }),
      ),
    );
    const { user, router } = openList('/applications?page=9');

    expect(await screen.findByText('The list has 25 applications on 2 pages.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go to the last page' }));

    expect(await rowFor('Acme Corp')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');
  });

  it('ignores bad values in a hand-edited link instead of failing', async () => {
    const asked = answerList(() => HttpResponse.json(sampleListPage([acme])));
    openList('/applications?page=abc&status=FOO,OFFER&sortBy=password&search=%20acme%20');

    await rowFor('Acme Corp');
    expect(Object.fromEntries(asked[0]!)).toEqual({ status: 'OFFER', search: 'acme' });
  });

  it('shows a newly added application when you come back to the list', async () => {
    let saved = false;
    answerList(() => HttpResponse.json(sampleListPage(saved ? [acme] : [])));
    server.use(
      http.post(API, () => {
        saved = true;
        return HttpResponse.json({ data: sampleApplication() }, { status: 201 });
      }),
    );
    const { user, router } = openList();
    await screen.findByRole('heading', { name: 'No applications yet' });

    await user.click(screen.getAllByRole('link', { name: 'Add application' })[0]!);
    await user.type(screen.getByLabelText('Company'), 'Acme Corp');
    await user.type(screen.getByLabelText('Role'), 'Backend Engineer');
    await user.click(screen.getByRole('button', { name: 'Save application' }));
    await screen.findByText('Application saved.');
    // The form's entry was replaced by the new application's page, so Back is the list.
    await act(() => router.navigate(-1));

    expect(await rowFor('Acme Corp')).toBeInTheDocument();
  });
});
