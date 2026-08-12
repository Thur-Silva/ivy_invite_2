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
  /**
   * Salt do hash que identifica o aparelho de quem responde.
   *
   * Opcional para o projeto rodar em clone limpo, mas o padrão está no
   * repositório: em produção, defina o seu, senão o digest deixa de ser secreto
   * e o espaço de IPv4 é pequeno o bastante para força bruta.
   */
  RSVP_DEVICE_SALT: z.string().min(16).optional(),

  /**
   * Segredo que assina o cookie de sessão do Auth.js. Obrigatório em produção.
   * Gere com: `npx auth secret`
   */
  AUTH_SECRET: z.string().min(16).optional(),

  /*
   * Credenciais de OAuth. Cada provedor é opcional: sem as duas variáveis, o
   * botão correspondente simplesmente não aparece. Isso mantém o projeto
   * rodando em clone limpo e permite publicar só com o Google, se preferirem.
   */
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  AUTH_FACEBOOK_ID: z.string().min(1).optional(),
  AUTH_FACEBOOK_SECRET: z.string().min(1).optional(),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = serverEnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  RSVP_DEVICE_SALT: process.env.RSVP_DEVICE_SALT,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  AUTH_FACEBOOK_ID: process.env.AUTH_FACEBOOK_ID,
  AUTH_FACEBOOK_SECRET: process.env.AUTH_FACEBOOK_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  throw new Error(
    `Variáveis de ambiente inválidas:\n${z.prettifyError(parsed.error)}\nVeja .env.example.`,
  );
}

export const serverEnv = parsed.data;
