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
      WEB_ORIGIN: 'http://localhost:5173',
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
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

  it.each(['http://localhost:5173/', 'http://localhost:5173/app', 'localhost:5173'])(
    'refuses a WEB_ORIGIN that is not just an origin: %s',
    (WEB_ORIGIN) => {
      expect(() => loadConfig({ DATABASE_URL, WEB_ORIGIN })).toThrow(/WEB_ORIGIN/);
    },
  );

  describe('Google settings', () => {
    const google = { GOOGLE_CLIENT_ID: 'id.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 's' };
    const production = { DATABASE_URL, NODE_ENV: 'production', WEB_ORIGIN: 'https://jbt.example' };

    it('are optional in development, and blank values count as not set', () => {
      const config = loadConfig({ DATABASE_URL, GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: ' ' });

      expect(config.GOOGLE_CLIENT_ID).toBeUndefined();
      expect(config.GOOGLE_CLIENT_SECRET).toBeUndefined();
    });

    it('must be set together', () => {
      expect(() => loadConfig({ DATABASE_URL, GOOGLE_CLIENT_ID: 'id' })).toThrow(
        /GOOGLE_CLIENT_SECRET/,
      );
    });

    it('are required in production, and so is an https WEB_ORIGIN', () => {
      expect(() => loadConfig(production)).toThrow(/GOOGLE_CLIENT_ID/);
      expect(() =>
        loadConfig({ ...production, ...google, WEB_ORIGIN: 'http://jbt.example' }),
      ).toThrow(/WEB_ORIGIN/);
      expect(loadConfig({ ...production, ...google }).GOOGLE_CLIENT_ID).toBe(
        google.GOOGLE_CLIENT_ID,
      );
    });
  });
});
