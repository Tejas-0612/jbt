import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * tailwind-merge resolves conflicting classes ("px-2 px-4" → "px-4"). It must be
 * told about our custom theme names, otherwise it can mistake `text-small`
 * (a font size) for a text colour and silently drop one of them.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['small', 'display'] }],
      shadow: [{ shadow: ['card', 'overlay', 'button'] }],
    },
  },
});

/** Combine class names, with later Tailwind classes winning over earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
