import { describe, expect, it } from 'vitest';
import { normalizeCompanyName } from './company-name';

describe('normalizeCompanyName', () => {
  it('ignores case and extra spaces', () => {
    expect(normalizeCompanyName('  ACME   Corp ')).toBe('acme corp');
    expect(normalizeCompanyName('Acme\tCorp')).toBe('acme corp');
  });

  it('treats the two ways of typing an accent as the same', () => {
    const composed = 'Café Labs'; // é as one character
    const decomposed = 'Café Labs'; // e + combining accent

    expect(normalizeCompanyName(decomposed)).toBe(normalizeCompanyName(composed));
  });

  it('keeps punctuation, so different names stay different', () => {
    expect(normalizeCompanyName('AT&T')).toBe('at&t');
    expect(normalizeCompanyName('Acme Corp.')).not.toBe(normalizeCompanyName('Acme Corp'));
  });
});
