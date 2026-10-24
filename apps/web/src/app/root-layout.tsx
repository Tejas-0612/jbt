import { HouseIcon, PlusCircleIcon, PlusIcon, type Icon } from '@phosphor-icons/react';
import { Link, NavLink, Outlet, useMatch } from 'react-router';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/wordmark';
import { AccountMenu } from '@/features/auth/account-menu';
import { useMe } from '@/features/auth/api';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: Icon;
}

/*
 * Only pages that exist get a navigation item: Applications, Agenda and Settings
 * join with their slices. The phone tab bar follows the same rule.
 */
const SIDEBAR_ITEMS: NavItem[] = [{ to: '/', label: 'Dashboard', icon: HouseIcon }];
const TAB_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: HouseIcon },
  { to: '/applications/new', label: 'Add', icon: PlusCircleIcon },
];

/**
 * The frame around every page (Harbor Slate): a sidebar and a top bar on wider
 * screens, a bottom tab bar on phones. Each page renders into <Outlet />.
 */
export function RootLayout() {
  const onAddPage = useMatch('/applications/new') !== null;
  // Always there: RequireSignIn only renders this layout once /me has answered.
  const { data: me } = useMe();

  return (
    <div className="min-h-svh md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh flex-col gap-8 bg-sidebar px-4 py-5 md:flex">
        <Wordmark />
        <nav aria-label="Main">
          <ul className="flex flex-col gap-1">
            {SIDEBAR_ITEMS.map(({ to, label, icon: ItemIcon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex h-[38px] items-center gap-3 rounded-md px-3 text-sm font-medium text-subtle-foreground transition-colors hover:bg-card/60 hover:text-foreground',
                      // Active: reads like a selected card.
                      isActive && 'bg-card text-brand-deep shadow-card hover:bg-card',
                    )
                  }
                >
                  <ItemIcon aria-hidden className="size-[18px]" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center gap-3 px-4 md:px-8">
          <div className="md:hidden">
            <Wordmark />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Phones use the "Add" tab instead; no button on the form itself. */}
            {!onAddPage && (
              <Button asChild className="hidden md:inline-flex">
                <Link to="/applications/new">
                  <PlusIcon aria-hidden />
                  Add application
                </Link>
              </Button>
            )}
            {me && <AccountMenu me={me} />}
          </div>
        </header>
        {/* Bottom padding on phones keeps content clear of the tab bar. */}
        <main className="flex-1 px-4 pb-24 md:px-8 md:pb-12">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t bg-card md:hidden">
        <ul className="grid grid-cols-2">
          {TAB_ITEMS.map(({ to, label, icon: ItemIcon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground',
                    isActive && 'text-brand-deep',
                  )
                }
              >
                <ItemIcon aria-hidden className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
