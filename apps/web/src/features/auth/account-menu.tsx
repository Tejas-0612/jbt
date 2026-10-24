import type { Me } from '@jbt/shared';
import { SignOutIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSignOut } from './api';

/** "Teja Shinde" → "TS", "Sample User A" → "SA", "madonna" → "M". */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** The avatar in the top bar (Harbor Slate: a pale slate circle with initials) and its menu. */
export function AccountMenu({ me }: { me: Me }) {
  const signOut = useSignOut();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function onSignOut() {
    try {
      await signOut.mutateAsync();
    } catch {
      return; // still signed in: say so (below), so nobody walks away thinking otherwise
    }
    // Forget everything cached, so the next person at this computer can't see it.
    queryClient.clear();
    await navigate('/login', { replace: true });
  }

  return (
    <div className="flex items-center gap-3">
      {signOut.isError && (
        <p role="alert" className="text-small text-destructive">
          Couldn&apos;t sign out. Try again.
        </p>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Account: ${me.name}`}
            className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-brand-deep transition-colors hover:bg-primary/25"
          >
            {initialsOf(me.name)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">{me.name}</span>
            <span className="truncate font-normal">{me.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void onSignOut()}>
            <SignOutIcon aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
