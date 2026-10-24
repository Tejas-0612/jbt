// shadcn/ui Input (added with `shadcn add input`, style radix-nova), restyled for
// Harbor Slate: 40px tall, 8px corners, white fill, 15px text. Focus uses the global
// :focus-visible ring, so no outline-none here. This file is ours: edit freely.
import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
