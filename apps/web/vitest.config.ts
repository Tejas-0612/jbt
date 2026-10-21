import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts: tests don't need Tailwind or the dev proxy.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // A simulated browser page (no window opens), so components can render.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Tests check behaviour, not looks; jsdom doesn't do layout anyway.
    css: false,
    // The icon library is one entry file re-exporting ~1,500 icons. Unbundled,
    // every test that renders an icon loaded all of them (~11 s per file).
    // Pre-bundling it into one file once makes those tests fast again.
    deps: {
      optimizer: {
        client: { enabled: true, include: ['@phosphor-icons/react'] },
      },
    },
  },
});
