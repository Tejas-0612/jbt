import { apiErrorBody } from '@jbt/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderPage } from '@/test/render';
import { server } from '@/test/server';
import { StatusPage } from './status-page';

describe('StatusPage', () => {
  it('shows “Checking…” first, then Running and Ready', async () => {
    renderPage(<StatusPage />);

    expect(screen.getByRole('heading', { name: 'System status' })).toBeInTheDocument();
    expect(screen.getAllByText('Checking…')).toHaveLength(2);

    expect(await screen.findByText('Running')).toBeInTheDocument();
    expect(await screen.findByText('Ready')).toBeInTheDocument();
  });

  it('explains what to do when the database is unreachable', async () => {
    server.use(
      http.get('/ready', () =>
        HttpResponse.json(apiErrorBody('NOT_READY', 'The database is unreachable'), {
          status: 503,
        }),
      ),
    );
    renderPage(<StatusPage />);

    expect(
      await screen.findByText('Not reachable. Is Docker running? (pnpm docker:up)'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Running')).toBeInTheDocument();
  });

  it('says the API is down, and doesn’t guess about the database', async () => {
    server.use(
      http.get('/health', () => new HttpResponse(null, { status: 502 })),
      http.get('/ready', () => new HttpResponse(null, { status: 502 })),
    );
    renderPage(<StatusPage />);

    expect(
      await screen.findByText('Not responding. Is it running? (pnpm dev)'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Unknown while the API is down')).toBeInTheDocument();
  });

  it('asks the API again when “Check again” is clicked', async () => {
    let healthCalls = 0;
    server.use(
      http.get('/health', () => {
        healthCalls += 1;
        return HttpResponse.json({ data: { status: 'ok' } });
      }),
    );
    const user = userEvent.setup();
    renderPage(<StatusPage />);

    // The button is disabled while checking; wait until both checks are done.
    const button = screen.getByRole('button', { name: 'Check again' });
    await waitFor(() => expect(button).toBeEnabled());
    expect(healthCalls).toBe(1);

    await user.click(button);

    await waitFor(() => expect(healthCalls).toBe(2));
  });
});
