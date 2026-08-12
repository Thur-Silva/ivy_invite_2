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
   * Credenciais do Google. Opcionais: sem as duas, o botão simplesmente não
   * aparece e o resto do convite continua funcionando em clone limpo.
   */
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),

  /*
   * Serviço de mensageria (Ivy Messager).
   *
   * Sem o token, nenhum e-mail é enviado e o convite segue funcionando: o
   * composition root cai para o publisher que só registra em log. Notificação é
   * melhoria, não requisito para alguém confirmar presença.
   */
  IVY_MESSAGER_BASE_URL: z.string().min(1).default('https://messager-lyart-nu.vercel.app'),
  IVY_MESSAGER_TOKEN: z.string().min(1).optional(),

  /**
   * Quem recebe aviso a cada resposta. Lista separada por vírgula.
   *
   * Vive em variável de ambiente, e não em `celebration.config.ts`, por dois
   * motivos: é decisão operacional (quem monitora), não fato da festa; e manter
   * fora do config evita que o contexto RSVP precise importar o Celebration,
   * quebrando a fronteira que a arquitetura promete.
   */
  RSVP_NOTIFY_EMAILS: z.string().optional(),

  /**
   * URL pública do convite, usada no botão dos e-mails.
   *
   * Na Vercel é inferida de `VERCEL_PROJECT_PRODUCTION_URL`, então só precisa ser
   * definida em outro tipo de hospedagem ou para apontar um domínio próprio.
   */
  INVITATION_URL: z.string().min(1).optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * String vazia é ausência.
 *
 * `IVY_MESSAGER_TOKEN=""` no `.env`, ou um campo deixado em branco no painel da
 * Vercel, chega como `''`, e `''` não é `undefined`: `z.string().min(1).optional()`
 * **rejeita** e o boot inteiro morre com "variáveis de ambiente inválidas".
 *
 * Aconteceu de verdade nesta integração, e derrubaria o deploy do mesmo jeito.
 * Normalizar aqui, uma vez, protege toda variável opcional presente e futura, em
 * vez de exigir que cada schema lembre de tratar o caso.
 */
function absentWhenBlank(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === '' ? undefined : value;
}

const parsed = serverEnvSchema.safeParse({
  DATABASE_URL: absentWhenBlank(process.env.DATABASE_URL),
  RSVP_DEVICE_SALT: absentWhenBlank(process.env.RSVP_DEVICE_SALT),
  AUTH_SECRET: absentWhenBlank(process.env.AUTH_SECRET),
  AUTH_GOOGLE_ID: absentWhenBlank(process.env.AUTH_GOOGLE_ID),
  AUTH_GOOGLE_SECRET: absentWhenBlank(process.env.AUTH_GOOGLE_SECRET),
  IVY_MESSAGER_BASE_URL: absentWhenBlank(process.env.IVY_MESSAGER_BASE_URL),
  IVY_MESSAGER_TOKEN: absentWhenBlank(process.env.IVY_MESSAGER_TOKEN),
  RSVP_NOTIFY_EMAILS: absentWhenBlank(process.env.RSVP_NOTIFY_EMAILS),
  INVITATION_URL: absentWhenBlank(process.env.INVITATION_URL),
  VERCEL_PROJECT_PRODUCTION_URL: absentWhenBlank(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  NODE_ENV: absentWhenBlank(process.env.NODE_ENV),
});

if (!parsed.success) {
  throw new Error(
    `Variáveis de ambiente inválidas:\n${z.prettifyError(parsed.error)}\nVeja .env.example.`,
  );
}

export const serverEnv = parsed.data;
