import { defineConfig } from 'vitest/config';

/**
 * Domain and Application tests only — no browser, no database, no server.
 *
 * That is a property of the architecture, not a shortcut: because the inner
 * layers depend on ports instead of adapters, the whole business behaviour of
 * the invitation is verifiable in milliseconds with `environment: node`.
 */
export default defineConfig({
  // Resolves the `@/*` alias straight from tsconfig.json — one source of truth.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
  },
});
