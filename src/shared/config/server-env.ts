import 'server-only';
import { z } from 'zod';

/**
 * Server-side configuration, validated once at module load.
 *
 * `server-only` makes it a build error to import this from a Client Component,
 * so a connection string can never be bundled into the browser payload.
 *
 * `DATABASE_URL` is optional on purpose: a contributor can clone the repo and
 * run `npm run dev` with zero setup, and the composition root falls back to the
 * in-memory repository (see `rsvpModule`).
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = serverEnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  throw new Error(
    `Variáveis de ambiente inválidas:\n${z.prettifyError(parsed.error)}\nVeja .env.example.`,
  );
}

export const serverEnv = parsed.data;
