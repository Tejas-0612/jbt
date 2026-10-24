import { apiErrorBody } from '@jbt/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { sampleApplication, sampleMe } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const notSignedIn = () =>
  HttpResponse.json(apiErrorBody('UNAUTHORIZED', 'You are not signed in.'), { status: 401 });

/** /me answers 401 until the test signs in (dev login), then the user. */
function signedOutUntilDevLogin() {
  const signIns: unknown[] = [];
  server.use(
    http.get('/api/v1/me', () =>
      signIns.length > 0 ? HttpResponse.json({ data: sampleMe() }) : notSignedIn(),
    ),
    http.post('/api/v1/auth/dev-login', async ({ request }) => {
      signIns.push(await request.json());
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return signIns;
}

const locationOf = (router: ReturnType<typeof renderApp>['router']) =>
  router.state.location.pathname + router.state.location.search;

describe('signing in', () => {
  it('sends a signed-out visitor to the sign-in page, remembering where they were going', async () => {
    signedOutUntilDevLogin();
    const { router } = renderApp({ path: '/applications/new', signedIn: false });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(locationOf(router)).toBe('/login?returnTo=%2Fapplications%2Fnew');
    // Outside the app's frame: no navigation for signed-out visitors.
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it("links to Google through the API, with the page to return to and the browser's timezone", () => {
    renderApp({ path: '/login?returnTo=/applications/new', signedIn: false });

    const link = screen.getByRole('link', { name: 'Continue with Google' });
    const href = new URL(link.getAttribute('href') ?? '', 'http://localhost');
    expect(href.pathname).toBe('/api/v1/auth/google');
    expect(href.searchParams.get('returnTo')).toBe('/applications/new');
    expect(href.searchParams.get('timezone')).toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });

  it('never passes on a return page on another site', () => {
    renderApp({ path: '/login?returnTo=%2F%2Fevil.example', signedIn: false });

    const link = screen.getByRole('link', { name: 'Continue with Google' });
    expect(
      new URL(link.getAttribute('href') ?? '', 'http://localhost').searchParams.get('returnTo'),
    ).toBe('/');
  });

  it.each([
    ['cancelled', 'Sign-in was cancelled.'],
    ['expired', 'took too long'],
    ['failed', "Couldn't finish signing in with Google."],
    ['unverified_email', "Google hasn't verified that account's email address."],
    ['not_configured', "Sign-in with Google isn't set up on this server yet."],
    ['something-new', "Couldn't finish signing in with Google."],
  ])('explains ?error=%s', (code, message) => {
    signedOutUntilDevLogin();
    renderApp({ path: `/login?error=${code}`, signedIn: false });

    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('signs in as a sample user in development, then opens the page the user wanted', async () => {
    const signIns = signedOutUntilDevLogin();
    const user = userEvent.setup();
    const { router } = renderApp({ path: '/login?returnTo=/applications/new', signedIn: false });

    await user.click(screen.getByRole('button', { name: 'Sign in as Sample User B' }));

    expect(await screen.findByRole('heading', { name: 'Add an application' })).toBeInTheDocument();
    expect(signIns).toEqual([{ user: 'b' }]);
    expect(locationOf(router)).toBe('/applications/new');
  });

  it('skips the sign-in page for someone already signed in', async () => {
    const { router } = renderApp({ path: '/login?returnTo=/applications/new' });

    expect(await screen.findByRole('heading', { name: 'Add an application' })).toBeInTheDocument();
    expect(locationOf(router)).toBe('/applications/new');
  });

  it("says so when the server can't be reached, and tries again on request", async () => {
    let reachable = false;
    server.use(
      http.get('/api/v1/me', () =>
        reachable ? HttpResponse.json({ data: sampleMe() }) : HttpResponse.error(),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: '/', signedIn: false });

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't reach the server.");
    reachable = true;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('button', { name: 'Account: Sample User A' }),
    ).toBeInTheDocument();
  });
});

describe('the account menu and signing out', () => {
  it("shows the user's initials, and their name and email in the menu", async () => {
    const user = userEvent.setup();
    renderApp({ path: '/' });

    const avatar = screen.getByRole('button', { name: 'Account: Sample User A' });
    expect(avatar).toHaveTextContent('SA');
    await user.click(avatar);

    expect(await screen.findByRole('menu')).toHaveTextContent('Sample User A');
    expect(screen.getByRole('menu')).toHaveTextContent('user-a@example.com');
  });

  it('signs out, forgets the cached user and lands on the sign-in page', async () => {
    let signedOut = false;
    server.use(
      http.post('/api/v1/auth/logout', () => {
        signedOut = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.get('/api/v1/me', () =>
        signedOut ? notSignedIn() : HttpResponse.json({ data: sampleMe() }),
      ),
    );
    const user = userEvent.setup();
    const { router } = renderApp({ path: '/applications/new' });

    await user.click(screen.getByRole('button', { name: 'Account: Sample User A' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    // If the cached user had survived, the sign-in page would bounce straight back into the app.
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(signedOut).toBe(true);
    expect(locationOf(router)).toBe('/login');
  });

  it('stays signed in, and says so, when signing out fails', async () => {
    server.use(http.post('/api/v1/auth/logout', () => HttpResponse.error()));
    const user = userEvent.setup();
    const { router } = renderApp({ path: '/' });

    await user.click(screen.getByRole('button', { name: 'Account: Sample User A' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't sign out.");
    expect(locationOf(router)).toBe('/');
  });
});

describe('when the session ends while the app is open', () => {
  it('goes to the sign-in page, and comes back to the same page afterwards', async () => {
    const application = sampleApplication();
    server.use(
      http.get(`/api/v1/applications/${application.id}`, notSignedIn),
      http.get('/api/v1/me', notSignedIn),
    );
    const { router } = renderApp({ path: `/applications/${application.id}` });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(locationOf(router)).toBe(`/login?returnTo=%2Fapplications%2F${application.id}`);
  });

  it('keeps what was typed in the form, and explains', async () => {
    server.use(http.post('/api/v1/applications', notSignedIn));
    const user = userEvent.setup();
    const { router } = renderApp({ path: '/applications/new' });

    await user.type(screen.getByLabelText('Company'), 'Acme Corp');
    await user.type(screen.getByLabelText('Role'), 'Backend Engineer');
    await user.click(screen.getByRole('button', { name: 'Save application' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("You've been signed out.");
    expect(screen.getByLabelText('Company')).toHaveValue('Acme Corp');
    await waitFor(() => expect(locationOf(router)).toBe('/applications/new'));
  });
});
