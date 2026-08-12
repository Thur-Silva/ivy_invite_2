import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { serverEnv } from '@/shared/config/server-env';

/**
 * Autenticação do convidado. Subdomínio genérico: compramos pronto.
 *
 * O convite não tem cadastro, senha nem recuperação de conta. O que ele precisa
 * é de uma coisa só: **provar que quem responde é uma pessoa real e distinta**.
 * O Google resolve isso sem que a gente guarde uma única senha.
 *
 * ## Só Google
 *
 * O Facebook foi avaliado e descartado. O convite circula por WhatsApp entre
 * famílias, e conta do Google é praticamente universal em celular Android e em
 * quem usa Gmail. O segundo provedor traria um app para publicar, uma revisão da
 * Meta para passar e um botão a mais na tela, em troca de quase nenhum convidado
 * a mais.
 *
 * A estrutura continua preparada para vários: `SupportedProvider`,
 * `enabledProviders` e a lista de botões seguem plurais. Voltar a ter dois é
 * acrescentar um provider aqui e um valor em `ACCOUNT_PROVIDERS`.
 *
 * Estratégia de sessão em JWT, sem adapter de banco. O Auth.js não precisa de
 * tabelas próprias porque não há nada para persistir entre visitas: os dados da
 * conta que interessam ficam gravados na própria resposta (`Rsvp`), que é onde
 * fazem sentido para o negócio.
 */

/**
 * Rede de proteção contra `AUTH_URL` apontando para a máquina de alguém.
 *
 * O Auth.js monta o `redirect_uri` a partir de `AUTH_URL` quando ela existe, e
 * só infere do cabeçalho da requisição quando não existe. Uma `AUTH_URL` com
 * `localhost` cadastrada em produção manda o convidado para a máquina dele
 * depois de autenticar no Google, e o login quebra por inteiro. É um erro fácil
 * de cometer: basta copiar o `.env` local inteiro para o painel da Vercel.
 *
 * Em ambiente Vercel o valor correto é sempre o inferido dos cabeçalhos, então
 * uma `AUTH_URL` local ali é sempre engano. Descartamos e avisamos, em vez de
 * confiar e derrubar o login.
 */
function discardLocalhostAuthUrl(): void {
  if (process.env.VERCEL !== '1') return;

  for (const key of ['AUTH_URL', 'NEXTAUTH_URL'] as const) {
    const value = process.env[key];
    if (value !== undefined && /localhost|127\.0\.0\.1/.test(value)) {
      console.warn(
        `[auth] ${key}="${value}" em ambiente Vercel. Ignorando e inferindo a URL ` +
          'dos cabeçalhos. Remova a variável do painel para silenciar este aviso.',
      );
      delete process.env[key];
    }
  }
}

discardLocalhostAuthUrl();

/** Provedores que o convite aceita. Espelha `AccountProvider` no domínio. */
export type SupportedProvider = 'google';

interface ProviderOption {
  readonly id: SupportedProvider;
  readonly label: string;
}

/**
 * Só entra o provedor com credencial configurada.
 *
 * Sem isso, um botão configurado pela metade levaria o convidado a uma tela de
 * erro do Google. Faltando a credencial, o botão não existe, e o clone limpo do
 * repositório continua subindo.
 */
function buildProviders(): { providers: NextAuthConfig['providers']; enabled: ProviderOption[] } {
  const providers: NextAuthConfig['providers'] = [];
  const enabled: ProviderOption[] = [];

  if (serverEnv.AUTH_GOOGLE_ID !== undefined && serverEnv.AUTH_GOOGLE_SECRET !== undefined) {
    providers.push(
      Google({
        clientId: serverEnv.AUTH_GOOGLE_ID,
        clientSecret: serverEnv.AUTH_GOOGLE_SECRET,
      }),
    );
    enabled.push({ id: 'google', label: 'Entrar com Google' });
  }

  return { providers, enabled };
}

const { providers, enabled } = buildProviders();

/** Botões que a tela de login deve mostrar. Vazio = nada configurado ainda. */
export const enabledProviders: readonly ProviderOption[] = enabled;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  secret: serverEnv.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
  callbacks: {
    /**
     * O `sub` do provedor é o que identifica a pessoa de forma estável.
     * E-mail pode mudar, nome pode mudar; o `sub` não. Guardamos os dois no
     * token porque o domínio usa o `sub` como chave e o e-mail para sugerir o
     * primeiro nome.
     */
    jwt({ token, account, profile }) {
      if (account !== null && account !== undefined) {
        token.provider = account.provider;
        token.providerSubject = account.providerAccountId;
      }
      if (profile?.email !== undefined && profile.email !== null) {
        token.email = profile.email;
      }
      return token;
    },

    session({ session, token }) {
      session.provider = typeof token.provider === 'string' ? token.provider : undefined;
      session.providerSubject =
        typeof token.providerSubject === 'string' ? token.providerSubject : undefined;
      return session;
    },
  },
});
