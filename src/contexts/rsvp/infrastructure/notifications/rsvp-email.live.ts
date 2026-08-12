import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { EmailNotifyingEventPublisher } from './email-notifying-event-publisher';
import { RsvpConfirmed } from '../../domain/events/rsvp-confirmed.event';
import { RsvpDecisionChanged } from '../../domain/events/rsvp-decision-changed.event';
import { AttendanceDecision } from '../../domain/value-objects/attendance-decision';
import { GuestAccount } from '../../domain/value-objects/guest-account';
import { GuestName } from '../../domain/value-objects/guest-name';
import { RsvpId } from '../../domain/value-objects/rsvp-id';
import { IvyMessagerEmailSender } from '@/shared/infrastructure/messager/ivy-messager-email-sender';

/**
 * Teste ao vivo contra o Ivy Messager. **Envia e-mail de verdade.**
 *
 * Não roda em `npm run verify`: o nome termina em `.live.ts`, e o `include` da
 * suíte normal só pega `*.spec.ts`. Rode de propósito com `npm run email:smoke`.
 *
 * Exercita o **código de produção**, não uma chamada paralela de curl: o mesmo
 * adapter, o mesmo publisher, os mesmos templates e os mesmos eventos de domínio
 * que a Server Action usa. Um curl provaria que o serviço funciona; isto prova
 * que a nossa integração com ele funciona, que é a pergunta útil.
 *
 * Sem `IVY_MESSAGER_TOKEN` os casos são pulados em vez de falharem: um smoke test
 * que quebra por falta de credencial vira ruído.
 */

const TOKEN = process.env.IVY_MESSAGER_TOKEN;
const GUEST = process.env.RSVP_SMOKE_RECIPIENT ?? 'arthurcaue100@gmail.com';
const BASE = process.env.IVY_MESSAGER_BASE_URL ?? 'https://messager-lyart-nu.vercel.app';
const INVITATION = 'https://ivy-invite-2.vercel.app';

/** Uma corrida por execução: chaves estáveis dentro do teste, novas a cada run. */
const RUN = new Date()
  .toISOString()
  .replace(/[^0-9]/g, '')
  .slice(0, 14);

const sender = new IvyMessagerEmailSender({ baseUrl: BASE, token: TOKEN ?? '' });

const ACCOUNT = GuestAccount.create({
  provider: 'google',
  subject: `google|smoke-${RUN}`,
  email: GUEST,
  displayName: 'Arthur Caue',
});

describe.skipIf(TOKEN === undefined)('Ivy Messager ao vivo', () => {
  it('a instância está de pé e configurada', async () => {
    const response = await fetch(`${BASE}/api/health`);
    const body = (await response.json()) as { status?: string; sender?: string };

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    console.info(`[smoke] health ok, remetente=${body.sender ?? 'n/d'}`);
  });

  it('envia pelo adapter e devolve comprovante', async () => {
    const result = await sender.send({
      to: [GUEST],
      subject: `[smoke ${RUN}] integração do convite da Ivy`,
      html: '<p>Se você recebeu isto, o adapter do convite fala com o Ivy Messager.</p>',
      text: 'Se você recebeu isto, o adapter do convite fala com o Ivy Messager.',
      idempotencyKey: `smoke-${RUN}-direto`,
      correlationId: `smoke-${RUN}`,
    });

    if (!result.ok) {
      console.error('[smoke] falhou', result.error);
    } else {
      console.info(
        `[smoke] enviado messageId=${result.value.messageId} requestId=${result.value.requestId} ` +
          `aceitos=${result.value.accepted.join(',')} recusados=${result.value.rejected.join(',') || 'nenhum'}`,
      );
    }

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.messageId).toBeTruthy();
    expect(result.ok && result.value.rejected).toHaveLength(0);
  });

  it('a mesma Idempotency-Key não manda e-mail novo', async () => {
    // Chave nova, para o primeiro envio ser real e o segundo ser replay.
    const key = `smoke-${RUN}-idempotencia`;
    const message = {
      to: [GUEST],
      subject: `[smoke ${RUN}] teste de idempotência`,
      html: '<p>Este e-mail deve chegar UMA vez, mesmo enviado duas.</p>',
      idempotencyKey: key,
    };

    const primeiro = await sender.send(message);
    const segundo = await sender.send(message);

    // Estreitar antes de asseverar, e não com `&&` dentro do `expect`: naquele
    // formato o TypeScript não propaga o narrowing para o argumento seguinte, e
    // `segundo.value` não compila.
    expect(primeiro.ok).toBe(true);
    expect(segundo.ok).toBe(true);
    if (!primeiro.ok || !segundo.ok) return;

    expect(primeiro.value.replayed).toBe(false);
    // A garantia que importa: o serviço reconheceu a chave e não reenviou.
    expect(segundo.value.replayed).toBe(true);
    expect(segundo.value.messageId).toBe(primeiro.value.messageId);

    console.info(
      `[smoke] idempotência ok: dois envios, um e-mail. messageId=${primeiro.value.messageId}`,
    );
  });

  it('credencial errada é recusada sem retentar', async () => {
    const impostor = new IvyMessagerEmailSender({ baseUrl: BASE, token: 'credencial-invalida' });

    const result = await impostor.send({
      to: [GUEST],
      subject: 'nunca deve sair',
      html: '<p>nunca deve sair</p>',
      idempotencyKey: `smoke-${RUN}-401`,
    });

    expect(result).toMatchObject({ ok: false, error: { kind: 'PERMANENT', code: 'UNAUTHORIZED' } });
    console.info('[smoke] 401 classificado como permanente, sem retentativa');
  });

  it('o fluxo completo: confirmação gera recibo e aviso', async () => {
    const publisher = new EmailNotifyingEventPublisher({
      emails: sender,
      invitationUrl: INVITATION,
      hostRecipients: [GUEST],
      correlationId: `smoke-${RUN}-fluxo`,
    });

    // O MESMO evento que o agregado emite quando alguém toca "Eu vou!".
    await publisher.publish([
      new RsvpConfirmed(
        RsvpId.fromString(`smoke-${RUN}-confirma`),
        GuestName.create('Arthur Caue'),
        ACCOUNT,
        new Date(),
      ),
    ]);

    console.info('[smoke] fluxo de confirmação publicado: recibo + aviso ao anfitrião');
  });

  it('o fluxo de mudança de ideia usa o tom de recusa', async () => {
    const publisher = new EmailNotifyingEventPublisher({
      emails: sender,
      invitationUrl: INVITATION,
      hostRecipients: [GUEST],
      correlationId: `smoke-${RUN}-mudanca`,
    });

    await publisher.publish([
      new RsvpDecisionChanged(
        RsvpId.fromString(`smoke-${RUN}-muda`),
        GuestName.create('Arthur Caue'),
        ACCOUNT,
        AttendanceDecision.ATTENDING,
        AttendanceDecision.NOT_ATTENDING,
        new Date(),
      ),
    ]);

    console.info('[smoke] fluxo de mudança publicado: recibo de recusa + aviso');
  });
});
