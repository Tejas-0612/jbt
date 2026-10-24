// shadcn/ui Textarea (added with `shadcn add textarea`, style radix-nova), restyled
// for Harbor Slate: 120px to start, grows with its content (field-sizing, where the
// browser supports it), white fill. This file is ours: edit freely.
import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content flex min-h-30 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
