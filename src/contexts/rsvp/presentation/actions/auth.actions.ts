'use server';

import { signIn, signOut, type SupportedProvider } from '@/shared/auth/auth';

/**
 * Entrada e saída da conta do convidado.
 *
 * São Server Actions e não links porque o Auth.js precisa gerar um state de
 * CSRF a cada início de fluxo OAuth. Um `<a href>` estático não teria como.
 *
 * `redirectTo: '/#presenca'` traz a pessoa de volta exatamente à seção de onde
 * ela saiu, e não ao topo da página. Depois de dar a volta pelo Google, cair no
 * herói e ter que rolar de novo até o formulário é atrito puro.
 */
export async function signInWithProvider(provider: SupportedProvider): Promise<void> {
  await signIn(provider, { redirectTo: '/#presenca' });
}

export async function signOutGuest(): Promise<void> {
  await signOut({ redirectTo: '/#presenca' });
}
