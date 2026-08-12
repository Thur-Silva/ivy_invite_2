import type {
  EmailFailure,
  EmailMessage,
  EmailReceipt,
  EmailSender,
} from '@/shared/application/ports/email-sender';
import { fail, ok, type Result } from '@/shared/kernel/result';

/**
 * Anti-Corruption Layer sobre o Ivy Messager.
 *
 * Traduz o contrato HTTP do serviço para a porta `EmailSender` e implementa a
 * política de retentativa que a documentação dele recomenda. Nada disso escapa
 * daqui: quem chama vê `Result<EmailReceipt, EmailFailure>` e mais nada.
 *
 * ## O que a política de retentativa protege
 *
 * `400`, `401`, `405`, `413` e `422` **nunca** são retentados. O resultado não
 * muda e cada tentativa queima cota. Só `429`, `500`, `502` e `503` voltam, com
 * backoff exponencial e respeitando `Retry-After` quando ele vem, porque o
 * serviço sabe mais sobre a própria saturação que o nosso backoff.
 *
 * ## Por que a mesma Idempotency-Key em toda tentativa
 *
 * Um timeout de rede não diz se o e-mail saiu. Retentar às cegas duplica; não
 * retentar perde. Com a chave repetida, o serviço devolve o resultado original e
 * `replayed: true`, sem mandar nada de novo. A chave vem do chamador justamente
 * para ser derivada do evento de negócio, não da tentativa.
 */

/** Status em que retentar não muda nada. Ver tabela de erros da doc. */
const NON_RETRYABLE = new Set([400, 401, 405, 413, 422]);

/** Quatro tentativas: 0,5s, 1s, 2s de espera entre elas. */
const MAX_ATTEMPTS = 4;

/**
 * Teto por tentativa.
 *
 * O serviço corta em 30s, mas isto roda com o convidado esperando, então
 * abortamos bem antes. Uma notificação atrasada é aceitável; um formulário
 * travado meio minuto não é.
 */
const ATTEMPT_TIMEOUT_MS = 8_000;

interface MessagerSuccessBody {
  messageId?: unknown;
  requestId?: unknown;
  replayed?: unknown;
  accepted?: unknown;
  rejected?: unknown;
}

interface MessagerErrorBody {
  error?: { code?: unknown; message?: unknown; details?: { transient?: unknown } };
  requestId?: unknown;
}

/**
 * Resultado de uma tentativa.
 *
 * Carrega `retryAfterMs` junto da falha para o laço poder respeitar o
 * `Retry-After` do serviço em vez do backoff local, que é menos informado.
 */
type AttemptOutcome =
  | { readonly ok: true; readonly value: EmailReceipt }
  | { readonly ok: false; readonly error: EmailFailure; readonly retryAfterMs?: number };

export class IvyMessagerEmailSender implements EmailSender {
  constructor(
    private readonly config: {
      readonly baseUrl: string;
      readonly token: string;
      /** Injetável para os testes exercitarem a política sem tocar a rede. */
      readonly fetchImpl?: typeof fetch;
      readonly sleep?: (ms: number) => Promise<void>;
    },
  ) {}

  async send(message: EmailMessage): Promise<Result<EmailReceipt, EmailFailure>> {
    const fetchImpl = this.config.fetchImpl ?? fetch;
    const sleep = this.config.sleep ?? defaultSleep;
    let lastFailure: EmailFailure = {
      kind: 'TRANSIENT',
      code: 'NO_ATTEMPT_COMPLETED',
      message: 'Nenhuma tentativa de envio chegou a completar.',
    };

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const outcome = await this.attempt(fetchImpl, message);

      if (outcome.ok) return ok(outcome.value);
      if (outcome.error.kind === 'PERMANENT') return fail(outcome.error);

      lastFailure = outcome.error;

      const isLastAttempt = attempt === MAX_ATTEMPTS - 1;
      if (isLastAttempt) break;

      await sleep(outcome.retryAfterMs ?? 2 ** attempt * 500);
    }

    return fail(lastFailure);
  }

  private async attempt(fetchImpl: typeof fetch, message: EmailMessage): Promise<AttemptOutcome> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': message.idempotencyKey,
      };
      if (message.correlationId !== undefined) {
        headers['x-correlation-id'] = message.correlationId;
      }

      const response = await fetchImpl(`${trimSlash(this.config.baseUrl)}/api/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: [...message.to],
          subject: message.subject,
          html: message.html,
          ...(message.text === undefined ? {} : { text: message.text }),
          ...(message.replyTo === undefined ? {} : { replyTo: message.replyTo }),
        }),
        signal: controller.signal,
      });

      const body = (await safeJson(response)) as MessagerSuccessBody & MessagerErrorBody;

      if (response.ok) return { ok: true, value: toReceipt(body) };

      const failure = toFailure(response.status, body);
      if (failure.kind === 'PERMANENT') return { ok: false, error: failure };

      return { ok: false, error: failure, retryAfterMs: readRetryAfterMs(response) };
    } catch (error) {
      // Timeout e falha de rede são transientes por definição: a requisição não
      // chegou a ter resposta, então não há como saber que ela é definitiva.
      return {
        ok: false,
        error: {
          kind: 'TRANSIENT',
          code: isAbort(error) ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Falha de rede desconhecida.',
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function toReceipt(body: MessagerSuccessBody): EmailReceipt {
  return {
    messageId: asString(body.messageId) ?? '',
    requestId: asString(body.requestId) ?? '',
    replayed: body.replayed === true,
    accepted: asStringArray(body.accepted),
    rejected: asStringArray(body.rejected),
  };
}

/**
 * Classifica o erro.
 *
 * `422` e `502` chegam os dois como `DISPATCH_FAILED`, e a diferença está no
 * status: `422` é "este dado não é entregável", `502` é "tente de novo". O campo
 * `details.transient` confirma quando vem, mas o status é a fonte primária.
 */
function toFailure(status: number, body: MessagerErrorBody): EmailFailure {
  const code = asString(body.error?.code) ?? `HTTP_${status}`;
  const message = asString(body.error?.message) ?? `Serviço de e-mail respondeu ${status}.`;
  const requestId = asString(body.requestId);

  const permanent = NON_RETRYABLE.has(status) || body.error?.details?.transient === false;

  return {
    kind: permanent ? 'PERMANENT' : 'TRANSIENT',
    code,
    message,
    ...(requestId === undefined ? {} : { requestId }),
  };
}

function readRetryAfterMs(response: Response): number | undefined {
  const header = response.headers.get('retry-after');
  if (header === null) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    // Serviço fora do ar pode devolver HTML de gateway. Não é motivo para
    // estourar: o status já basta para classificar.
    return {};
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const asStringArray = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const trimSlash = (url: string): string => url.replace(/\/+$/, '');

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
