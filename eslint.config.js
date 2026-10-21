// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['**/dist/', '**/build/', '**/coverage/', '**/generated/', 'docs/']),

  js.configs.recommended,

  // Type-aware rules: they read our TypeScript types, so they catch bugs like
  // a forgotten `await` that plain syntax rules cannot see.
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // The web app: React rules + browser globals.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      // shadcn/ui components import `cn` from the `cn` package; ours lives in
      // @/lib/utils and knows our custom theme classes. Fix the import after
      // every `shadcn add` (and remove the `cn` dependency it adds).
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'cn', message: "Use `import { cn } from '@/lib/utils'` instead." }] },
      ],
    },
  },

  // shadcn/ui files export style helpers (e.g. `buttonVariants`) next to components.
  // Fast refresh then reloads the page for edits in this folder; that's fine.
  {
    files: ['apps/web/src/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // Plain JS config files (like this one) are not part of a tsconfig.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Last: turn off style rules that would fight with Prettier.
  prettier,
);
