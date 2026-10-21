import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Read only the API's PORT from the repo-root .env, so there is one source of truth.
// Not Vite's loadEnv(): it also picks up NODE_ENV=development (meant for the API)
// and silently turns `vite build` into a development build (found 2026-10-20).
const ROOT_ENV_FILE = fileURLToPath(new URL('../../.env', import.meta.url));
const rootEnv = existsSync(ROOT_ENV_FILE)
  ? (parseEnv(readFileSync(ROOT_ENV_FILE, 'utf8')) as Record<string, string | undefined>)
  : {};
// 127.0.0.1, not "localhost": Node may resolve localhost to IPv6 (::1),
// but the API listens on IPv4 only.
const apiUrl = `http://127.0.0.1:${rootEnv['PORT'] ?? '4000'}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    // The browser only ever talks to this dev server. It forwards API calls,
    // so web and API look like ONE site (what the login cookie will need).
    proxy: {
      '/api': apiUrl,
      // Dev only: the status page checks these. In production, hosting
      // platforms call /health and /ready on the API directly.
      '/health': apiUrl,
      '/ready': apiUrl,
    },
  },
});
