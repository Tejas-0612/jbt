import { APPLICATION_STATUSES } from '@jbt/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STATUS_LABELS } from './labels';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it.each(APPLICATION_STATUSES)('writes the %s status in words', (status) => {
    render(<StatusBadge status={status} />);

    // The colour is decoration; the label alone must say the status.
    expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
  });
});
