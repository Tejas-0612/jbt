import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('lets the later class win when two do the same job', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  // Plain tailwind-merge mistakes `text-small` (our 13px size) for a colour and
  // silently drops it here. Our configuration in utils.ts prevents that.
  it('keeps our custom font size next to a text colour', () => {
    expect(cn('text-small', 'text-foreground')).toBe('text-small text-foreground');
  });

  it('treats our custom font sizes as one group', () => {
    expect(cn('text-small', 'text-display')).toBe('text-display');
  });

  it('treats our custom shadows as one group', () => {
    expect(cn('shadow-card', 'shadow-overlay')).toBe('shadow-overlay');
  });

  it('skips false and undefined, for conditional classes', () => {
    const isActive = false;
    expect(cn('rounded-md', isActive && 'bg-accent', undefined)).toBe('rounded-md');
  });
});
