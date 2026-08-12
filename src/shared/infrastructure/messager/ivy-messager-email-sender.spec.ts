import { describe, expect, it, vi } from 'vitest';
import type { EmailMessage } from '@/shared/application/ports/email-sender';
import { IvyMessagerEmailSender } from './ivy-messager-email-sender';

const MESSAGE: EmailMessage = {
  to: ['maria.clara@gmail.com'],
  subject: 'Presença confirmada na festa da Ivy',
  html: '<p>Que alegria!</p>',
  text: 'Que alegria!',
  idempotencyKey: 'rsvp-abc-confirmado-convidado',
};

/** Resposta de sucesso, no formato que a doc do serviço documenta. */
function accepted(overrides: Record<string, unknown> = {}): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      messageId: '9d2a717e-40f7-407c-a6f6-9acbf7caaa24',
      status: 'SENT',
      recipientCount: 1,
      accepted: ['maria.clara@gmail.com'],
      rejected: [],
      replayed: false,
      requestId: 'gru1::abc-123',
      ...overrides,
    }),
    { status: 202, headers: { 'content-type': 'application/json' } },
  );
}

function errorResponse(
  status: number,
  code: string,
  extra: { retryAfter?: string; transient?: boolean } = {},
): Response {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (extra.retryAfter !== undefined) headers['retry-after'] = extra.retryAfter;

  return new Response(
    JSON.stringify({
      error: {
        code,
        message: `falha simulada ${code}`,
        ...(extra.transient === undefined ? {} : { details: { transient: extra.transient } }),
      },
      requestId: 'gru1::erro-456',
    }),
    { status, headers },
  );
}

/** Nunca dorme de verdade: o teste mede a política, não o relógio. */
function build(responses: Response[]) {
  const fetchImpl = vi.fn<typeof fetch>();
  for (const response of responses) fetchImpl.mockResolvedValueOnce(response);

  const waits: number[] = [];
  const sender = new IvyMessagerEmailSender({
    baseUrl: 'https://messager-lyart-nu.vercel.app/',
    token: 'token-de-teste',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    sleep: async (ms) => {
      waits.push(ms);
    },
  });

  return { sender, fetchImpl, waits };
}

describe('IvyMessagerEmailSender', () => {
  describe('requisição', () => {
    it('monta a chamada como a documentação pede', async () => {
      const { sender, fetchImpl } = build([accepted()]);

      await sender.send({ ...MESSAGE, correlationId: 'rastro-1' });

      const [url, init] = fetchImpl.mock.calls[0] ?? [];
      // Barra final da base não pode virar `//api/send`.
      expect(url).toBe('https://messager-lyart-nu.vercel.app/api/send');

      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(init?.method).toBe('POST');
      expect(headers.Authorization).toBe('Bearer token-de-teste');
      expect(headers['Idempotency-Key']).toBe('rsvp-abc-confirmado-convidado');
      expect(headers['x-correlation-id']).toBe('rastro-1');

      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body.to).toEqual(['maria.clara@gmail.com']);
      expect(body.subject).toBe(MESSAGE.subject);
      expect(body.html).toBe(MESSAGE.html);
      // Não existe campo `from`: o remetente não é configurável no serviço.
      expect(body).not.toHaveProperty('from');
    });

    it('omite replyTo e correlationId quando não foram informados', async () => {
      const { sender, fetchImpl } = build([accepted()]);

      await sender.send(MESSAGE);

      const [, init] = fetchImpl.mock.calls[0] ?? [];
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers['x-correlation-id']).toBeUndefined();
      expect(JSON.parse(String(init?.body))).not.toHaveProperty('replyTo');
    });
  });

  describe('sucesso', () => {
    it('traduz 202 em comprovante', async () => {
      const { sender } = build([accepted()]);

      const result = await sender.send(MESSAGE);

      expect(result).toEqual({
        ok: true,
        value: {
          messageId: '9d2a717e-40f7-407c-a6f6-9acbf7caaa24',
          requestId: 'gru1::abc-123',
          replayed: false,
          accepted: ['maria.clara@gmail.com'],
          rejected: [],
        },
      });
    });

    it('preserva replayed, que sinaliza que nenhum e-mail novo saiu', async () => {
      const { sender } = build([accepted({ replayed: true })]);

      const result = await sender.send(MESSAGE);

      expect(result.ok && result.value.replayed).toBe(true);
    });
  });

  describe('erros que NÃO devem ser retentados', () => {
    it.each([
      [400, 'INVALID_SUBJECT'],
      [401, 'UNAUTHORIZED'],
      [405, 'METHOD_NOT_ALLOWED'],
      [413, 'PAYLOAD_TOO_LARGE'],
      [422, 'DISPATCH_FAILED'],
    ])('para na primeira tentativa em %i', async (status, code) => {
      const { sender, fetchImpl } = build([errorResponse(status, code)]);

      const result = await sender.send(MESSAGE);

      expect(result).toMatchObject({
        ok: false,
        error: { kind: 'PERMANENT', code, requestId: 'gru1::erro-456' },
      });
      // A garantia que importa: uma chamada, não quatro. Retentar queima cota.
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });
  });

  describe('erros transientes', () => {
    it('retenta e devolve o sucesso quando ele chega', async () => {
      const { sender, fetchImpl } = build([
        errorResponse(502, 'DISPATCH_FAILED'),
        errorResponse(503, 'SERVICE_OVERLOADED'),
        accepted(),
      ]);

      const result = await sender.send(MESSAGE);

      expect(result.ok).toBe(true);
      expect(fetchImpl).toHaveBeenCalledTimes(3);
    });

    it('reusa a MESMA Idempotency-Key em toda retentativa', async () => {
      const { sender, fetchImpl } = build([errorResponse(502, 'DISPATCH_FAILED'), accepted()]);

      await sender.send(MESSAGE);

      const chaves = fetchImpl.mock.calls.map(
        ([, init]) => (init?.headers as Record<string, string>)['Idempotency-Key'],
      );
      // Chave diferente por tentativa não deduplica nada, e é como se manda
      // e-mail duplicado depois de um timeout.
      expect(chaves).toEqual(['rsvp-abc-confirmado-convidado', 'rsvp-abc-confirmado-convidado']);
    });

    it('respeita Retry-After em vez do backoff local', async () => {
      const { sender, waits } = build([
        errorResponse(429, 'RATE_LIMIT_EXCEEDED', { retryAfter: '7' }),
        accepted(),
      ]);

      await sender.send(MESSAGE);

      expect(waits).toEqual([7000]);
    });

    it('usa backoff exponencial quando não vem Retry-After', async () => {
      const { sender, waits } = build([
        errorResponse(500, 'INTERNAL_ERROR'),
        errorResponse(500, 'INTERNAL_ERROR'),
        errorResponse(500, 'INTERNAL_ERROR'),
        errorResponse(500, 'INTERNAL_ERROR'),
      ]);

      await sender.send(MESSAGE);

      // Três esperas para quatro tentativas: não se dorme depois da última.
      expect(waits).toEqual([500, 1000, 2000]);
    });

    it('desiste depois de quatro tentativas, reportando a última falha', async () => {
      const responses = Array.from({ length: 4 }, () => errorResponse(502, 'DISPATCH_FAILED'));
      const { sender, fetchImpl } = build(responses);

      const result = await sender.send(MESSAGE);

      expect(fetchImpl).toHaveBeenCalledTimes(4);
      expect(result).toMatchObject({ ok: false, error: { kind: 'TRANSIENT' } });
    });

    it('trata falha de rede como transiente', async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new Error('ECONNRESET'));
      const sender = new IvyMessagerEmailSender({
        baseUrl: 'https://exemplo.test',
        token: 't',
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleep: async () => undefined,
      });

      const result = await sender.send(MESSAGE);

      expect(result).toMatchObject({
        ok: false,
        error: { kind: 'TRANSIENT', code: 'NETWORK_ERROR' },
      });
      expect(fetchImpl).toHaveBeenCalledTimes(4);
    });
  });

  describe('resiliência de parsing', () => {
    it('não estoura quando o gateway devolve HTML em vez de JSON', async () => {
      const gatewayHtml = new Response('<html>502 Bad Gateway</html>', { status: 502 });
      const { sender } = build([gatewayHtml, accepted()]);

      const result = await sender.send(MESSAGE);

      expect(result.ok).toBe(true);
    });

    it('classifica como permanente quando details.transient é false', async () => {
      // O serviço usa o mesmo DISPATCH_FAILED em 422 e 502; details.transient
      // confirma a intenção quando vem.
      const { sender, fetchImpl } = build([
        errorResponse(502, 'DISPATCH_FAILED', { transient: false }),
      ]);

      const result = await sender.send(MESSAGE);

      expect(result).toMatchObject({ ok: false, error: { kind: 'PERMANENT' } });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });
  });
});
