import { apiErrorBody } from '@jbt/shared';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { formatCalendarDate } from '@/lib/dates';
import { sampleApplication } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const application = sampleApplication({
  location: 'Pune',
  workMode: 'HYBRID',
  jobUrl: 'https://jobs.example.com/42?ref=board',
  jobDescription: 'Build and run APIs.\nWork with the product team.',
});
const PATH = `/applications/${application.id}`;
const API = `/api/v1/applications/${application.id}`;

describe('Application page', () => {
  it('shows the application', async () => {
    server.use(http.get(API, () => HttpResponse.json({ data: application })));
    renderApp({ path: PATH });

    expect(await screen.findByRole('heading', { name: 'Backend Engineer' })).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument(); // the status badge
    expect(screen.getByText(formatCalendarDate('2026-10-20'))).toBeInTheDocument();
    expect(screen.getByText('Pune')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
    expect(screen.getByText(/Work with the product team/)).toBeInTheDocument();

    // The job link: short label, opens in a new tab without giving that tab access back.
    const link = screen.getByRole('link', { name: /jobs\.example\.com/ });
    expect(link).toHaveAttribute('href', application.jobUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('says what is missing instead of leaving gaps', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json({ data: sampleApplication({ status: 'SAVED', appliedOn: null }) }),
      ),
    );
    renderApp({ path: PATH });

    expect(await screen.findByText('Not applied yet')).toBeInTheDocument();
    expect(screen.getAllByText('Not added')).toHaveLength(3); // location, work mode, link
  });

  it('says "not found" for a missing application (or someone else’s)', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json(apiErrorBody('NOT_FOUND', 'Application not found'), { status: 404 }),
      ),
    );
    renderApp({ path: PATH });

    expect(
      await screen.findByRole('heading', { name: 'Application not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the dashboard' })).toHaveAttribute('href', '/');
  });

  it('offers to try again when the server does not answer', async () => {
    let attempts = 0;
    server.use(
      http.get(API, () => {
        attempts += 1;
        return attempts === 1 ? HttpResponse.error() : HttpResponse.json({ data: application });
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: PATH });

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Backend Engineer' })).toBeInTheDocument();
  });
});
