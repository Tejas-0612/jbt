import { describe, expect, it } from 'vitest';
import { loadConfig } from './env';

const DATABASE_URL = 'postgresql://user:secret@localhost:5433/somedb';

describe('loadConfig', () => {
  it('uses safe defaults for everything except DATABASE_URL', () => {
    expect(loadConfig({ DATABASE_URL })).toEqual({
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      PORT: 4000,
      LOG_LEVEL: 'info',
      DATABASE_URL,
    });
  });

  it('requires DATABASE_URL', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it('refuses a DATABASE_URL that is not a Postgres URL', () => {
    expect(() => loadConfig({ DATABASE_URL: 'mysql://user@localhost/somedb' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('turns PORT from text into a number', () => {
    expect(loadConfig({ DATABASE_URL, PORT: '5000' }).PORT).toBe(5000);
  });

  it('refuses a PORT that is not a number, and names the setting', () => {
    expect(() => loadConfig({ DATABASE_URL, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('refuses an unknown NODE_ENV', () => {
    expect(() => loadConfig({ DATABASE_URL, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
