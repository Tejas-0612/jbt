import { CaretDownIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { APPLICATION_LIST_LIMITS, APPLICATION_STATUSES, type ApplicationStatus } from '@jbt/shared';
import { useEffect, useEffectEvent, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { STATUS_LABELS } from './labels';
import { isFiltered, SORT_OPTIONS, type ListView } from './list-view';
import { StatusDot } from './status-badge';

/** How long typing must pause before the list searches. */
const SEARCH_DELAY_MS = 300;

export type ChangeView = (changes: Partial<ListView>, options?: { replace?: boolean }) => void;

/** Search, status filter and sort above the list, plus chips for the active filters. */
export function ListToolbar({ view, onChange }: { view: ListView; onChange: ChangeView }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Typing replaces the history entry: Back shouldn't step through every letter. */}
        <SearchField
          value={view.search}
          onSearch={(search) => onChange({ search }, { replace: true })}
        />
        <StatusFilter selected={view.statuses} onChange={(statuses) => onChange({ statuses })} />
        <SortSelect value={view.sort} onChange={(sort) => onChange({ sort })} />
      </div>

      {isFiltered(view) && (
        <div className="flex flex-wrap items-center gap-2">
          {view.statuses.map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              className="rounded-full"
              aria-label={`Remove the ${STATUS_LABELS[status]} filter`}
              onClick={() =>
                onChange({ statuses: view.statuses.filter((other) => other !== status) })
              }
            >
              <StatusDot status={status} />
              {STATUS_LABELS[status]}
              <XIcon aria-hidden />
            </Button>
          ))}
          <Button variant="link" size="sm" onClick={() => onChange({ search: '', statuses: [] })}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

function SearchField({ value, onSearch }: { value: string; onSearch: (search: string) => void }) {
  const id = useId();
  const [text, setText] = useState(value);

  // The URL can change without typing (Back, Clear filters): then show what it says,
  // unless that is what is being typed, give or take spaces ("front " keeps its space).
  const [shownValue, setShownValue] = useState(value);
  if (value !== shownValue) {
    setShownValue(value);
    if (text.trim() !== value) setText(value);
  }

  // Search once typing pauses, not on every key.
  const search = useEffectEvent(onSearch);
  useEffect(() => {
    const next = text.trim();
    if (next === value) return;
    const timer = setTimeout(() => search(next), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, value]);

  return (
    <form
      role="search"
      className="relative w-full sm:max-w-sm sm:flex-1"
      // Enter searches at once.
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(text.trim());
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search applications
      </label>
      <MagnifyingGlassIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={id}
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search company or role"
        maxLength={APPLICATION_LIST_LIMITS.search}
        className="pl-9"
      />
    </form>
  );
}

function StatusFilter({
  selected,
  onChange,
}: {
  selected: ApplicationStatus[];
  onChange: (statuses: ApplicationStatus[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          // Spelled out: a name built from the pieces inside would read "Status2".
          aria-label={selected.length > 0 ? `Status (${selected.length} selected)` : undefined}
        >
          Status
          {selected.length > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 text-xs text-brand-deep tabular-nums">
              {selected.length}
            </span>
          )}
          <CaretDownIcon aria-hidden className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {APPLICATION_STATUSES.map((status) => (
          <DropdownMenuCheckboxItem
            key={status}
            checked={selected.includes(status)}
            // Kept in pipeline order, whatever order they are picked in.
            onCheckedChange={(checked) =>
              onChange(
                APPLICATION_STATUSES.filter((other) =>
                  other === status ? checked : selected.includes(other),
                ),
              )
            }
            // Stay open, so several statuses can be picked in a row.
            onSelect={(event) => event.preventDefault()}
          >
            <StatusDot status={status} />
            {STATUS_LABELS[status]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: ListView['sort'];
  onChange: (sort: ListView['sort']) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:ml-auto sm:flex-none">
      <Label htmlFor={id} className="shrink-0 text-subtle-foreground">
        Sort
      </Label>
      <div className="min-w-0 flex-1 sm:w-56">
        <NativeSelect
          id={id}
          value={value.value}
          onChange={(event) =>
            onChange(
              SORT_OPTIONS.find((option) => option.value === event.target.value) ?? SORT_OPTIONS[0],
            )
          }
        >
          {SORT_OPTIONS.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
