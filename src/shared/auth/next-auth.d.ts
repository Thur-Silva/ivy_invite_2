import 'next-auth';
import 'next-auth/jwt';

/**
 * O Auth.js entrega uma sessão genérica (nome, e-mail, avatar). O convite
 * precisa de mais dois dados para identificar a pessoa de forma estável, e é
 * mais honesto declará-los no tipo do que espalhar `as` pelo código.
 */
declare module 'next-auth' {
  interface Session {
    /** Hoje sempre `google`. Fica string para aceitar outro provedor depois. */
    provider?: string;
    /** Id da pessoa no provedor. Estável mesmo se o e-mail mudar. */
    providerSubject?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    provider?: string;
    providerSubject?: string;
  }
}
