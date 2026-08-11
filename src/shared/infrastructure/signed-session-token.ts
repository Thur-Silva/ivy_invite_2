import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

/** Nome do cookie que marca o navegador de quem já respondeu. */
export const RSVP_SESSION_COOKIE = 'ivy_rsvp_session';

/**
 * Token de sessão assinado com HMAC.
 *
 * Formato: `<uuid>.<hmac-base64url>`.
 *
 * **O que a assinatura resolve:** impede que alguém escreva à mão o token de
 * outra pessoa e assuma a resposta dela. Sem HMAC, o cookie seria um campo de
 * texto que qualquer um edita no DevTools.
 *
 * **O que a assinatura não resolve:** ninguém é impedido de *apagar* o próprio
 * cookie e receber um token novo. Nenhum cookie resolve isso — é por essa razão
 * que o token é apenas um dos três sinais de `RespondentIdentity`, e não o único.
 */
export const SignedSessionToken = {
  issue(secret: string): string {
    const value = randomUUID();
    return `${value}.${sign(value, secret)}`;
  },

  /** Devolve o token se a assinatura confere; `null` se ausente ou adulterado. */
  verify(cookieValue: string | undefined, secret: string): string | null {
    if (cookieValue === undefined) return null;

    const separator = cookieValue.lastIndexOf('.');
    if (separator <= 0) return null;

    const value = cookieValue.slice(0, separator);
    const signature = cookieValue.slice(separator + 1);
    const expected = sign(value, secret);

    // Comparação em tempo constante: comparar assinaturas com `===` vaza, pelo
    // tempo de resposta, quantos caracteres iniciais o atacante acertou.
    const provided = Buffer.from(signature);
    const target = Buffer.from(expected);
    if (provided.length !== target.length) return null;
    if (!timingSafeEqual(provided, target)) return null;

    return cookieValue;
  },
};

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}
