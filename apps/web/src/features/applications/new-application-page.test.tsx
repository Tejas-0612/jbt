import { apiErrorBody, type Application } from '@jbt/shared';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { todayInBrowser } from '@/lib/dates';
import { sampleApplication } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const URL = '/api/v1/applications';

/** Fake POST that records what the form sent and answers like the API would. */
function acceptCreate(answer: Application = sampleApplication()) {
  const sent: unknown[] = [];
  server.use(
    http.post(URL, async ({ request }) => {
      sent.push(await request.json());
      return HttpResponse.json({ data: answer }, { status: 201 });
    }),
  );
  return sent;
}

function openForm() {
  const user = userEvent.setup();
  const app = renderApp({ path: '/applications/new' });
  return { user, ...app };
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Company'), 'Acme Corp');
  await user.type(screen.getByLabelText('Role'), 'Backend Engineer');
}

const saveButton = () => screen.getByRole('button', { name: /save application|saving/i });

describe('New application form', () => {
  it('starts as Applied, today', () => {
    openForm();

    expect(screen.getByRole('heading', { name: 'Add an application' })).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toHaveValue('APPLIED');
    expect(screen.getByLabelText('Applied on')).toHaveValue(todayInBrowser());
  });

  it('shows every problem at once when saved empty, and sends nothing', async () => {
    const sent = acceptCreate();
    const { user } = openForm();

    await user.click(saveButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Some fields need attention.');
    expect(screen.getByText('Add the company name')).toBeInTheDocument();
    expect(screen.getByText('Add the role')).toBeInTheDocument();
    // Marked invalid for screen readers, and the cursor is put where to fix it.
    expect(screen.getByLabelText('Company')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Company')).toHaveFocus();
    expect(sent).toHaveLength(0);
  });

  it('hides the date for a saved job, and brings today back for an applied one', async () => {
    const { user } = openForm();

    await user.selectOptions(screen.getByLabelText('Status'), 'SAVED');
    expect(screen.queryByLabelText('Applied on')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Status'), 'APPLIED');
    expect(screen.getByLabelText('Applied on')).toHaveValue(todayInBrowser());
  });

  it('refuses a link that is not http(s) before sending anything', async () => {
    const sent = acceptCreate();
    const { user } = openForm();
    await fillRequired(user);

    await user.type(screen.getByLabelText(/job link/i), 'javascript:alert(1)');
    await user.click(saveButton());

    expect(
      await screen.findByText('Enter the full link, starting with http:// or https://'),
    ).toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it('saves, then opens the new application in place of the form', async () => {
    const created = sampleApplication({ location: 'Pune', workMode: 'HYBRID' });
    const sent = acceptCreate(created);
    const { user, router } = openForm();
    await fillRequired(user);
    await user.type(screen.getByLabelText(/location/i), '  Pune ');
    await user.selectOptions(screen.getByLabelText(/work mode/i), 'HYBRID');

    await user.click(saveButton());

    expect(await screen.findByText('Application saved.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Backend Engineer' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/applications/${created.id}`);
    // What the API received: cleaned up, blanks as null, today's date.
    expect(sent).toEqual([
      {
        companyName: 'Acme Corp',
        roleTitle: 'Backend Engineer',
        status: 'APPLIED',
        appliedOn: todayInBrowser(),
        jobUrl: null,
        location: 'Pune',
        workMode: 'HYBRID',
        jobDescription: null,
      },
    ]);
  });

  it('goes Back to where you came from, not to the filled-in form', async () => {
    acceptCreate();
    const user = userEvent.setup();
    const { router } = renderApp({ path: '/' });
    await user.click(
      within(screen.getByRole('main')).getByRole('link', { name: 'Add application' }),
    );
    await fillRequired(user);
    await user.click(saveButton());
    expect(await screen.findByText('Application saved.')).toBeInTheDocument();

    await act(() => router.navigate(-1)); // the browser's Back button

    expect(router.state.location.pathname).toBe('/');
  });

  it("shows the API's messages on the right fields, keeping what was typed", async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json(
          apiErrorBody('VALIDATION_ERROR', 'Some fields need attention.', {
            formErrors: [],
            fieldErrors: { appliedOn: ["The applied date can't be in the future"] },
          }),
          { status: 400 },
        ),
      ),
    );
    const { user } = openForm();
    await fillRequired(user);

    await user.click(saveButton());

    expect(await screen.findByText("The applied date can't be in the future")).toBeInTheDocument();
    expect(screen.getByLabelText('Applied on')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Company')).toHaveValue('Acme Corp');
  });

  it("keeps everything when the server can't be reached", async () => {
    server.use(http.post(URL, () => HttpResponse.error()));
    const { user } = openForm();
    await fillRequired(user);

    await user.click(saveButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't reach the server. Nothing was saved, but your entries are still here.",
    );
    expect(screen.getByLabelText('Company')).toHaveValue('Acme Corp');
  });

  it('cannot be sent twice while saving', async () => {
    let calls = 0;
    let answer: (() => void) | undefined;
    server.use(
      http.post(URL, async () => {
        calls += 1;
        // Hold the answer until the test lets it go.
        await new Promise<void>((resolve) => (answer = resolve));
        return HttpResponse.json({ data: sampleApplication() }, { status: 201 });
      }),
    );
    const { user } = openForm();
    await fillRequired(user);

    await user.click(saveButton());
    await waitFor(() => expect(saveButton()).toHaveTextContent('Saving…'));
    expect(saveButton()).toBeDisabled();
    await user.click(saveButton());

    answer?.();
    expect(await screen.findByText('Application saved.')).toBeInTheDocument();
    expect(calls).toBe(1);
  });
});
