import { BriefcaseIcon, PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}

/**
 * PLACEHOLDER dashboard: the greeting and a way to add an application. Needs
 * attention, the KPIs and the pipeline arrive with the slices that provide their data.
 * It doesn't claim "no applications yet": without the list (slice 2) it can't know.
 */
export function DashboardPage() {
  const [greeting] = useState(() => greetingFor(new Date().getHours()));

  return (
    <div className="max-w-5xl py-6 md:py-10">
      <h1 className="font-display text-display font-medium tracking-[-0.01em]">{greeting}</h1>
      <p className="mt-2 text-subtle-foreground">
        Every application in one place, and always a clear next step.
      </p>

      <section className="mt-8 flex flex-col items-start gap-3 rounded-lg border bg-card p-6 shadow-card">
        <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <BriefcaseIcon aria-hidden className="size-5" />
        </span>
        <h2 className="text-lg font-semibold">Track an application</h2>
        <p className="max-w-prose text-subtle-foreground">
          Applied somewhere, or found a job worth saving? Company, role and date are enough to
          start.
        </p>
        <Button asChild className="mt-1">
          <Link to="/applications/new">
            <PlusIcon aria-hidden />
            Add application
          </Link>
        </Button>
      </section>
    </div>
  );
}
