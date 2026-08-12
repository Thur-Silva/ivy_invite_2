import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { EmailNotifyingEventPublisher } from './email-notifying-event-publisher';
import type { GuestRoster } from '../../application/use-cases/get-guest-roster.use-case';
import { GetGuestRoster } from '../../application/use-cases/get-guest-roster.use-case';
import { RsvpConfirmed } from '../../domain/events/rsvp-confirmed.event';
import { RsvpDecisionChanged } from '../../domain/events/rsvp-decision-changed.event';
import { AttendanceDecision } from '../../domain/value-objects/attendance-decision';
import { GuestAccount } from '../../domain/value-objects/guest-account';
import { GuestName } from '../../domain/value-objects/guest-name';
import { RsvpId } from '../../domain/value-objects/rsvp-id';
import { NeonRsvpRepository } from '../persistence/neon-rsvp.repository';
import type { EmailSender } from '@/shared/application/ports/email-sender';
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
 * ## Um e-mail, não uma rajada
 *
 * A versão anterior mandava cinco fluxos, cada um com recibo **e** relatório para
 * o mesmo endereço: oito e-mails por execução. Verificar integração não justifica
 * entupir caixa de entrada de ninguém.
 *
 * Agora o padrão publica **uma** confirmação, que gera os dois e-mails que ela
 * deve gerar: o recibo do convidado e o relatório com o gráfico cheio. Health e
 * credencial errada não enviam nada. A bateria completa (seis e-mails) existe
 * atrás de `RSVP_SMOKE_FULL=1`, para quem estiver mexendo nos templates.
 *
 * Sem `IVY_MESSAGER_TOKEN` os casos são pulados em vez de falharem: um smoke test
 * que quebra por falta de credencial vira ruído.
 */

const TOKEN = process.env.IVY_MESSAGER_TOKEN;
const GUEST = process.env.RSVP_SMOKE_RECIPIENT ?? 'arthurcaue100@gmail.com';
const BASE = process.env.IVY_MESSAGER_BASE_URL ?? 'https://messager-lyart-nu.vercel.app';
const INVITATION = 'https://ivy-invite-2.vercel.app';

/** Bateria completa. Fora dela, a execução manda um único e-mail. */
const FULL = process.env.RSVP_SMOKE_FULL === '1';

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

/**
 * A lista que alimenta o gráfico do relatório.
 *
 * Com `DATABASE_URL`, lê o banco de verdade, e o e-mail que chega mostra o estado
 * real do convite. Sem banco, cai numa lista de demonstração: um smoke test que
 * exige Neon para provar que o **e-mail** está certo obriga a configurar demais
 * para verificar de menos.
 */
const DEMO_ROSTER: GuestRoster = {
  entries: [
    { name: 'Arthur Caue', attending: true, respondedAtIso: new Date().toISOString() },
    { name: 'Maria Clara Souza', attending: true, respondedAtIso: new Date().toISOString() },
    { name: 'João Pedro Lima', attending: false, respondedAtIso: new Date().toISOString() },
    { name: 'Ana Beatriz', attending: true, respondedAtIso: new Date().toISOString() },
    { name: 'Tia Lúcia', attending: true, respondedAtIso: new Date().toISOString() },
    { name: 'Vovô Antônio', attending: false, respondedAtIso: new Date().toISOString() },
  ],
  attendingCount: 4,
  notAttendingCount: 2,
  total: 6,
  attendingPercent: 67,
};

const DATABASE_URL = process.env.DATABASE_URL;

function resolveRoster(): { execute(): Promise<GuestRoster> } {
  if (DATABASE_URL === undefined || DATABASE_URL.trim() === '') {
    return { execute: async () => DEMO_ROSTER };
  }
  return new GetGuestRoster({ rsvps: new NeonRsvpRepository(DATABASE_URL) });
}

describe.skipIf(TOKEN === undefined)('Ivy Messager ao vivo', () => {
  it('a instância está de pé e configurada', async () => {
    const response = await fetch(`${BASE}/api/health`);
    const body = (await response.json()) as { status?: string; sender?: string };

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    console.info(`[smoke] health ok, remetente=${body.sender ?? 'n/d'}`);
  });

  it.runIf(FULL)('envia pelo adapter e devolve comprovante', async () => {
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

  it.runIf(FULL)('a mesma Idempotency-Key não manda e-mail novo', async () => {
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

  it.runIf(FULL)('o fluxo completo: confirmação gera recibo e relatório', async () => {
    const publisher = new EmailNotifyingEventPublisher({
      emails: sender,
      invitationUrl: INVITATION,
      adminRecipients: [GUEST],
      roster: resolveRoster(),
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

    console.info('[smoke] fluxo de confirmação publicado: recibo + relatório do admin');
  });

  /**
   * O único envio da execução padrão: uma confirmação, os dois e-mails que ela
   * gera. Dois é o número certo aqui, e o caso afirma isso, porque já houve uma
   * versão que suprimia o recibo quando convidado e admin eram o mesmo endereço.
   *
   * Usa a lista de demonstração mesmo havendo banco: conferir uma barra de 0%
   * não prova nada sobre o desenho do gráfico.
   */
  it('a confirmação entrega recibo e relatório, um de cada', async () => {
    const enviados: string[] = [];
    const contando: EmailSender = {
      async send(message) {
        enviados.push(message.subject);
        return sender.send(message);
      },
    };

    const publisher = new EmailNotifyingEventPublisher({
      emails: contando,
      invitationUrl: INVITATION,
      adminRecipients: [GUEST],
      roster: { execute: async () => DEMO_ROSTER },
      correlationId: `smoke-${RUN}-relatorio`,
    });

    await publisher.publish([
      new RsvpConfirmed(
        RsvpId.fromString(`smoke-${RUN}-relatorio`),
        GuestName.create('Arthur Caue'),
        ACCOUNT,
        new Date(),
      ),
    ]);

    // Dois, nem mais nem menos: o recibo do convidado e o relatório do admin.
    expect(enviados).toHaveLength(2);
    expect(enviados[0]).toContain('confirmada');
    expect(enviados[1]).toContain('confirmou presença');

    console.info(
      `[smoke] dois e-mails enviados: "${enviados[0]}" e "${enviados[1]}", ` +
        `com ${DEMO_ROSTER.attendingCount} vão, ${DEMO_ROSTER.notAttendingCount} não vão, ` +
        `${DEMO_ROSTER.total} responderam`,
    );
  });

  it.runIf(FULL)('o fluxo de mudança de ideia usa o tom de recusa', async () => {
    const publisher = new EmailNotifyingEventPublisher({
      emails: sender,
      invitationUrl: INVITATION,
      adminRecipients: [GUEST],
      roster: resolveRoster(),
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

    console.info('[smoke] fluxo de mudança publicado: recibo de recusa + relatório');
  });
});
