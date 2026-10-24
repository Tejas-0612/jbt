import { CheckIcon } from '@phosphor-icons/react';
import type { ApplicationStatus } from '@jbt/shared';
import { cn } from '@/lib/utils';
import { STATUS_LABELS } from './labels';

/*
 * Full class names per status (Tailwind only finds classes written out in full).
 * Badge: a 12% tint of the status colour with its darker text variant (4.5:1+,
 * approved 2026-10-18). ACCEPTED is the one solid badge: it appears at most once.
 */
const BADGE: Record<ApplicationStatus, string> = {
  SAVED: 'bg-status-saved/12 text-status-saved-text',
  APPLIED: 'bg-status-applied/12 text-status-applied-text',
  SCREENING: 'bg-status-screening/12 text-status-screening-text',
  INTERVIEWING: 'bg-status-interviewing/12 text-status-interviewing-text',
  OFFER: 'bg-status-offer/12 text-status-offer-text',
  ACCEPTED: 'bg-status-accepted text-status-accepted-text',
  REJECTED: 'bg-status-rejected/12 text-status-rejected-text',
  WITHDRAWN: 'bg-status-withdrawn/12 text-status-withdrawn-text',
  GHOSTED: 'bg-status-ghosted/12 text-status-ghosted-text',
};

const DOT: Record<ApplicationStatus, string> = {
  SAVED: 'bg-status-saved',
  APPLIED: 'bg-status-applied',
  SCREENING: 'bg-status-screening',
  INTERVIEWING: 'bg-status-interviewing',
  OFFER: 'bg-status-offer',
  ACCEPTED: 'bg-status-accepted',
  REJECTED: 'bg-status-rejected',
  WITHDRAWN: 'bg-status-withdrawn',
  GHOSTED: 'bg-status-ghosted',
};

/** The coloured dot of a status. Decorative: the status is always written next to it. */
export function StatusDot({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn('inline-block size-2 rounded-full', DOT[status], className)} />
  );
}

/** A status as a pill: dot + label (a check instead of the dot for Accepted). */
export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-small font-semibold',
        BADGE[status],
      )}
    >
      {status === 'ACCEPTED' ? (
        <CheckIcon aria-hidden weight="bold" className="size-3" />
      ) : (
        <StatusDot status={status} className="size-1.5" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
