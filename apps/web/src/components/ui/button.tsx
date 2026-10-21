// shadcn/ui Button (added with `shadcn add button`, style radix-nova),
// restyled for Harbor Slate. This file is ours: edit freely.
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Focus uses the global :focus-visible ring (2px slate + 2px gap), so no outline-none here.
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-colors select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary: slate fill, one per view. The shadow + inner bottom edge make a muted
        // colour still read as clickable; dark mode uses lighter surfaces instead.
        default:
          'bg-primary text-primary-foreground shadow-button hover:bg-primary-hover dark:shadow-none',
        // Design's "secondary button": white, warm hairline border, main text.
        outline:
          'border-border bg-card text-foreground hover:bg-accent aria-expanded:bg-accent dark:border-input',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-accent aria-expanded:bg-secondary',
        ghost: 'text-foreground hover:bg-accent aria-expanded:bg-accent',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30',
        // Design's "tertiary button": slate text only.
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        // 32px compact, for row actions such as "Done".
        sm: 'h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        // 44px: comfortable touch target.
        lg: 'h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        xs: "h-6 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        icon: 'size-10',
        'icon-xs': "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
