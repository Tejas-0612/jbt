import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderPage } from '@/test/render';
import { NotFoundPage } from './not-found-page';

describe('NotFoundPage', () => {
  it('says the page is missing and links back to the start page', async () => {
    renderPage(<NotFoundPage />, { path: '/this-does-not-exist' });

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the start page' })).toHaveAttribute('href', '/');
  });
});
