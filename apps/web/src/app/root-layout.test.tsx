import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';

// jsdom applies no CSS, so both the sidebar (wide screens) and the tab bar (phones)
// are present here; in a browser only one of them is visible at a time.
describe('App shell', () => {
  it('greets you on the dashboard, marked as the current page', () => {
    renderApp({ path: '/' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /^Good (morning|afternoon|evening)\.$/,
    );
    // The sidebar says "Dashboard", the phone tab bar says "Home".
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens the form from "Add application"', async () => {
    const user = userEvent.setup();
    const { router } = renderApp({ path: '/' });
    const dashboard = screen.getByRole('main');

    await user.click(within(dashboard).getByRole('link', { name: 'Add application' }));

    expect(screen.getByRole('heading', { name: 'Add an application' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/applications/new');
  });

  it('shows "Page not found" inside the shell for an unknown address', () => {
    renderApp({ path: '/no-such-page' });

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0);
  });
});
