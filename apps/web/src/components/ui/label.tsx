// shadcn/ui Label (added with `shadcn add label`, style radix-nova), restyled for
// Harbor Slate: 14px, medium weight, secondary text colour. This file is ours.
import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-1.5 text-sm leading-5 font-medium text-subtle-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
