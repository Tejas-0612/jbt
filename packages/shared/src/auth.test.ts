import { describe, expect, it } from 'vitest';
import { isSafeReturnTo } from './auth';

describe('isSafeReturnTo', () => {
  it.each(['/', '/applications/123', '/applications?status=APPLIED&page=2', '/a#notes'])(
    'accepts a path on our site: %s',
    (path) => {
      expect(isSafeReturnTo(path)).toBe(true);
    },
  );

  it.each([
    ['another site', 'https://evil.example'],
    ['no protocol, which browsers read as another site', '//evil.example'],
    ['a backslash, which browsers read as a slash', '/\\evil.example'],
    ['a tab, which browsers skip', '/\t/evil.example'],
    ['a newline', '/\n/evil.example'],
    ['a relative path', 'applications/123'],
    ['javascript:', 'javascript:alert(1)'],
    ['nothing', ''],
    ['something very long', `/${'a'.repeat(2000)}`],
  ])('refuses %s', (_label, path) => {
    expect(isSafeReturnTo(path)).toBe(false);
  });
});
