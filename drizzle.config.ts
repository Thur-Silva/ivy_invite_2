import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Migration tooling for the Neon database.
 *
 * The schema path is a glob across Bounded Contexts on purpose: each context
 * owns its own tables inside its own `infrastructure/persistence/drizzle`
 * folder, and adding a context never means editing this file.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/contexts/*/infrastructure/persistence/drizzle/*.schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
