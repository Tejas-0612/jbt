import { FlagIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';

/** "Job Tracker" is a placeholder name until the product gets its real one. */
export function Wordmark() {
  return (
    <Link to="/" className="flex w-fit items-center gap-2.5 rounded-md">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <FlagIcon aria-hidden weight="bold" className="size-4" />
      </span>
      <span className="font-bold text-brand-deep">Job Tracker</span>
    </Link>
  );
}
