'use server';

import { cookies, headers } from 'next/headers';
import type { RespondentSignals } from '@/shared/application/ports/respondent-identifier';
import { auth } from '@/shared/auth/auth';
import {
  RSVP_SESSION_COOKIE,
  SignedSessionToken,
} from '@/shared/infrastructure/signed-session-token';
import { makeSubmitRsvp, resolveDeviceSalt } from '../../infrastructure/composition-root';
import {
  RSVP_FIELD_NAMES,
  rsvpFormSchema,
  type RsvpFormState,
  type RsvpFormValues,
} from '../rsvp-form.contract';

/** O cookie precisa sobreviver até bem depois da festa. */
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

/**
 * Coleta os três sinais de identificação e garante o cookie de sessão.
 *
 * **Token (cookie assinado)**. O sinal mais forte: sobrevive a troca de rede,
 * de Wi-Fi para 4G e de operadora. Se não existir ou vier adulterado, emite um
 * novo. Assinado com HMAC para que ninguém escreva à mão o token de outra pessoa
 * e assuma a resposta dela.
 *
 * **Aparelho**. `user-agent` e `accept-language`, lidos pelo servidor, mais os
 * traços que o navegador reporta no campo oculto (resolução, densidade, fuso,
 * plataforma). Sem JavaScript o campo vem vazio e a assinatura fica mais fraca,
 * porém estável. Que é o que a regra exige.
 *
 * **Rede**. `x-forwarded-for`, só confiável atrás de um proxy que o
 * *sobrescreve*. A Vercel faz isso, então o primeiro item é o cliente real e o
 * navegador não consegue forjá-lo. Fora desse cenário a leitura vira palpite.
 *
 * Nenhum desses valores é persistido cru: viram digest na porta
 * `RespondentIdentifier` antes de qualquer coisa.
 */
async function collectRespondentSignals(clientTraits: string): Promise<RespondentSignals> {
  const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);
  const secret = resolveDeviceSalt();

  const existingToken = SignedSessionToken.verify(
    cookieStore.get(RSVP_SESSION_COOKIE)?.value,
    secret,
  );
  const sessionToken = existingToken ?? SignedSessionToken.issue(secret);

  if (existingToken === null) {
    cookieStore.set(RSVP_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      path: '/',
    });
  }

  return {
    sessionToken,
    userAgent: headerList.get('user-agent') ?? '',
    acceptLanguage: headerList.get('accept-language') ?? '',
    clientTraits,
    networkAddress: resolveNetworkAddress(
      headerList.get('x-forwarded-for'),
      headerList.get('x-real-ip'),
    ),
  };
}

function resolveNetworkAddress(forwardedFor: string | null, realIp: string | null): string {
  const client = forwardedFor?.split(',')[0]?.trim();
  if (client !== undefined && client.length > 0) return client;

  const fallback = realIp?.trim();
  if (fallback !== undefined && fallback.length > 0) return fallback;

  // `next dev` local não tem proxy: todo mundo cai no mesmo endereço fictício.
  // Proposital. Permite testar o bloqueio. Para destravar, apague a linha em
  // `npm run db:studio`.
  return 'endereco-nao-identificado';
}

/**
 * Driving adapter. The HTTP edge of the RSVP Bounded Context.
 *
 * The only thing this function is allowed to do: translate a `FormData` payload
 * into a Command, hand it to the Use Case, and translate the `Result` back into
 * view state. No business rule, no SQL, no `if` about attendance. Because it is
 * a Server Action, the browser reaches it by POST and the form keeps working
 * with JavaScript disabled.
 */
export async function submitRsvpAction(
  _previousState: RsvpFormState,
  formData: FormData,
): Promise<RsvpFormState> {
  const values: RsvpFormValues = {
    guestName: String(formData.get(RSVP_FIELD_NAMES.guestName) ?? ''),
    decision: String(formData.get(RSVP_FIELD_NAMES.decision) ?? ''),
  };

  const payload = rsvpFormSchema.safeParse(values);

  if (!payload.success) {
    // A forma está errada, o que na prática significa que a pessoa enviou sem
    // tocar em "Eu vou!" nem em "Não vou poder".
    return {
      status: 'invalid',
      field: 'decision',
      message: 'Toque em "Eu vou!" ou "Não vou poder" antes de enviar.',
      values,
    };
  }

  /*
   * A conta vem da SESSÃO, nunca do formulário.
   *
   * É o ponto mais sensível desta feature. Se o provedor, o e-mail ou o id
   * viessem em campos do `<form>`, bastaria abrir o DevTools e trocá-los para
   * responder no lugar de outra pessoa, e o login não valeria absolutamente
   * nada. Aqui só o cookie assinado do Auth.js pode dizer quem é quem.
   */
  const session = await auth();
  if (
    session === null ||
    session.provider === undefined ||
    session.providerSubject === undefined ||
    session.user?.email === undefined ||
    session.user.email === null
  ) {
    return {
      status: 'locked',
      reason: 'UNAUTHENTICATED',
      message: 'Sua sessão expirou. Entre de novo com o Google para confirmar.',
    };
  }

  const respondent = await collectRespondentSignals(
    String(formData.get(RSVP_FIELD_NAMES.deviceTraits) ?? ''),
  );

  const result = await makeSubmitRsvp().execute({
    ...payload.data,
    account: {
      provider: session.provider,
      subject: session.providerSubject,
      email: session.user.email,
      displayName: session.user.name ?? '',
    },
    respondent,
  });

  if (!result.ok) {
    switch (result.error.kind) {
      case 'VALIDATION':
        return {
          status: 'invalid',
          field: result.error.field,
          message: result.error.message,
          values,
        };

      case 'NAME_TAKEN':
        return { status: 'locked', reason: 'NAME', message: result.error.message };

      case 'UNAVAILABLE':
        return { status: 'failed', message: result.error.message, values };
    }
  }

  return {
    status: 'success',
    guestFirstName: result.value.guestFirstName,
    decision: result.value.decision,
    submission: result.value.status,
  };
}
