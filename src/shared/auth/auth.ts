import NextAuth, { type NextAuthConfig } from 'next-auth';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';
import { serverEnv } from '@/shared/config/server-env';

/**
 * Autenticação do convidado. Subdomínio genérico: compramos pronto.
 *
 * O convite não tem cadastro, senha nem recuperação de conta. O que ele precisa
 * é de uma coisa só: **provar que quem responde é uma pessoa real e distinta**.
 * Google e Facebook resolvem isso sem que a gente guarde uma única senha.
 *
 * Estratégia de sessão em JWT, sem adapter de banco. O Auth.js não precisa de
 * tabelas próprias porque não há nada para persistir entre visitas: os dados da
 * conta que interessam ficam gravados na própria resposta (`Rsvp`), que é onde
 * fazem sentido para o negócio.
 */

/** Provedores que o convite aceita. Espelha `AccountProvider` no domínio. */
export type SupportedProvider = 'google' | 'facebook';

interface ProviderOption {
  readonly id: SupportedProvider;
  readonly label: string;
}

/**
 * Só entram os provedores com credencial configurada.
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

  if (serverEnv.AUTH_FACEBOOK_ID !== undefined && serverEnv.AUTH_FACEBOOK_SECRET !== undefined) {
    providers.push(
      Facebook({
        clientId: serverEnv.AUTH_FACEBOOK_ID,
        clientSecret: serverEnv.AUTH_FACEBOOK_SECRET,
      }),
    );
    enabled.push({ id: 'facebook', label: 'Entrar com Facebook' });
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
