import { CompassIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col items-start justify-center gap-4 px-4 py-12">
      <CompassIcon aria-hidden className="size-10 text-muted-foreground" />
      <h1 className="font-display text-display font-medium tracking-[-0.01em]">Page not found</h1>
      <p className="text-subtle-foreground">
        This page doesn’t exist. It may have moved, or the link may be wrong.
      </p>
      <Button asChild>
        <Link to="/">Go to the start page</Link>
      </Button>
    </main>
  );
}
