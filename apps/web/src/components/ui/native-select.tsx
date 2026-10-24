// shadcn/ui NativeSelect (added with `shadcn add native-select`, style radix-nova),
// restyled for Harbor Slate like Input. A real <select>: accessible, and phones show
// their own picker. This file is ours: edit freely.
import * as React from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <div
      className="relative w-full has-[select:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        className={cn(
          'h-10 w-full min-w-0 appearance-none rounded-md border border-input bg-card pr-9 pl-3 text-base text-foreground transition-colors disabled:cursor-not-allowed aria-invalid:border-destructive',
          className,
        )}
        {...props}
      />
      <CaretDownIcon
        aria-hidden
        data-slot="native-select-icon"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
  return (
    <option
      data-slot="native-select-option"
      // System colours, so the opened list follows light/dark mode on every OS.
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOption };
