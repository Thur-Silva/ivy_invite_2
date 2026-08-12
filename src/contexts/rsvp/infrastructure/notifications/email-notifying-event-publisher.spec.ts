import { beforeEach, describe, expect, it } from 'vitest';
import type {
  EmailFailure,
  EmailMessage,
  EmailReceipt,
  EmailSender,
} from '@/shared/application/ports/email-sender';
import { fail, ok, type Result } from '@/shared/kernel/result';
import { RsvpConfirmed } from '../../domain/events/rsvp-confirmed.event';
import { RsvpDeclined } from '../../domain/events/rsvp-declined.event';
import { RsvpDecisionChanged } from '../../domain/events/rsvp-decision-changed.event';
import { AttendanceDecision } from '../../domain/value-objects/attendance-decision';
import { GuestAccount } from '../../domain/value-objects/guest-account';
import { GuestName } from '../../domain/value-objects/guest-name';
import { RsvpId } from '../../domain/value-objects/rsvp-id';
import { EmailNotifyingEventPublisher } from './email-notifying-event-publisher';

const ID = RsvpId.fromString('rsvp-1');
const NAME = GuestName.create('Maria Clara Souza');
const ACCOUNT = GuestAccount.create({
  provider: 'google',
  subject: 'google|1001',
  email: 'maria.clara@gmail.com',
  displayName: 'Maria Clara Souza',
});
const AT = new Date('2026-08-12T14:00:00Z');

/** Registra tudo que passou pela porta, sem tocar a rede. */
class RecordingEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];
  private outcome: Result<EmailReceipt, EmailFailure> = ok({
    messageId: 'msg-1',
    requestId: 'req-1',
    replayed: false,
    accepted: [],
    rejected: [],
  });

  failWith(error: EmailFailure): void {
    this.outcome = fail(error);
  }

  async send(message: EmailMessage): Promise<Result<EmailReceipt, EmailFailure>> {
    this.sent.push(message);
    return this.outcome;
  }
}

/** Explode ao ser chamado. Prova que `publish` não propaga exceção. */
class ExplodingEmailSender implements EmailSender {
  async send(): Promise<Result<EmailReceipt, EmailFailure>> {
    throw new Error('provedor caiu de forma inesperada');
  }
}

describe('EmailNotifyingEventPublisher', () => {
  let emails: RecordingEmailSender;

  const build = (hostRecipients: readonly string[] = ['mae@ivy.test', 'pai@ivy.test']) =>
    new EmailNotifyingEventPublisher({
      emails,
      invitationUrl: 'https://ivy-invite-2.vercel.app',
      hostRecipients,
    });

  beforeEach(() => {
    emails = new RecordingEmailSender();
  });

  describe('RsvpConfirmed', () => {
    it('escreve para o convidado e para os anfitriões', async () => {
      await build().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      expect(emails.sent).toHaveLength(2);

      const [convidado, anfitriao] = emails.sent;
      expect(convidado?.to).toEqual(['maria.clara@gmail.com']);
      expect(convidado?.subject).toContain('confirmada');
      expect(convidado?.html).toContain('Maria');

      expect(anfitriao?.to).toEqual(['mae@ivy.test', 'pai@ivy.test']);
      expect(anfitriao?.subject).toContain('Maria Clara Souza');
      // Responder o aviso fala com quem confirmou, não com a caixa do serviço.
      expect(anfitriao?.replyTo).toBe('maria.clara@gmail.com');
    });

    it('deriva a chave de idempotência do fato, não da tentativa', async () => {
      await build().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      expect(emails.sent.map((message) => message.idempotencyKey)).toEqual([
        'rsvp-rsvp-1-confirmado-convidado',
        'rsvp-rsvp-1-confirmado-anfitriao',
      ]);
    });

    it('publicar o mesmo evento duas vezes reusa as chaves', async () => {
      const publisher = build();
      const event = new RsvpConfirmed(ID, NAME, ACCOUNT, AT);

      await publisher.publish([event]);
      await publisher.publish([event]);

      const chaves = emails.sent.map((message) => message.idempotencyKey);
      // O serviço deduplica pela chave: o segundo par não gera e-mail novo.
      expect(new Set(chaves).size).toBe(2);
      expect(chaves).toHaveLength(4);
    });

    it('sempre inclui parte texto puro, além do HTML', async () => {
      await build().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      for (const message of emails.sent) {
        expect(message.text).toBeTruthy();
        // Sem marcação e sem entidade escapada: quem lê em texto puro merece
        // texto puro, não `&#39;` no meio da frase.
        expect(message.text).not.toContain('<');
        expect(message.text).not.toContain('&#');
        expect(message.text).toContain('Ver o convite: https://ivy-invite-2.vercel.app');
      }
    });

    it('não repete data nem endereço, só aponta para o convite', async () => {
      await build().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      const convidado = emails.sent[0];
      expect(convidado?.html).toContain('https://ivy-invite-2.vercel.app');
      // Detalhe da festa envelhece na caixa de entrada. O convite é a fonte.
      expect(convidado?.html).not.toMatch(/setembro|Estrada|Extrema/i);
    });
  });

  describe('RsvpDeclined', () => {
    it('usa tom de recusa e avisa os anfitriões', async () => {
      await build().publish([new RsvpDeclined(ID, NAME, ACCOUNT, AT)]);

      const [convidado, anfitriao] = emails.sent;
      expect(convidado?.subject).toContain('registrada');
      expect(convidado?.html).toContain('sentir sua falta');
      expect(anfitriao?.subject).toContain('não vai poder ir');
      expect(emails.sent.map((message) => message.idempotencyKey)).toEqual([
        'rsvp-rsvp-1-recusado-convidado',
        'rsvp-rsvp-1-recusado-anfitriao',
      ]);
    });
  });

  describe('RsvpDecisionChanged', () => {
    it('escolhe o tom pela decisão nova', async () => {
      await build().publish([
        new RsvpDecisionChanged(
          ID,
          NAME,
          ACCOUNT,
          AttendanceDecision.NOT_ATTENDING,
          AttendanceDecision.ATTENDING,
          AT,
        ),
      ]);

      expect(emails.sent[0]?.subject).toContain('confirmada');
      expect(emails.sent[1]?.subject).toContain('vai à festa');
    });

    it('avisa o anfitrião que houve mudança de ideia', async () => {
      await build().publish([
        new RsvpDecisionChanged(
          ID,
          NAME,
          ACCOUNT,
          AttendanceDecision.ATTENDING,
          AttendanceDecision.NOT_ATTENDING,
          AT,
        ),
      ]);

      expect(emails.sent[1]?.html).toContain('mudou de ideia');
    });
  });

  describe('sem anfitriões configurados', () => {
    it('escreve só para o convidado', async () => {
      await build([]).publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      expect(emails.sent).toHaveLength(1);
      expect(emails.sent[0]?.to).toEqual(['maria.clara@gmail.com']);
    });
  });

  describe('nunca derruba quem chamou', () => {
    it('engole falha permanente do serviço', async () => {
      emails.failWith({
        kind: 'PERMANENT',
        code: 'DISPATCH_FAILED',
        message: 'endereço recusado',
        requestId: 'req-9',
      });

      await expect(
        build().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]),
      ).resolves.toBeUndefined();
    });

    it('engole exceção inesperada do adapter', async () => {
      const publisher = new EmailNotifyingEventPublisher({
        emails: new ExplodingEmailSender(),
        invitationUrl: 'https://exemplo.test',
        hostRecipients: ['mae@ivy.test'],
      });

      // A resposta ao convidado já foi enviada quando isto roda. Relançar aqui
      // só derrubaria a invocação sem ajudar ninguém.
      await expect(
        publisher.publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]),
      ).resolves.toBeUndefined();
    });
  });

  describe('eventos que não são deste assinante', () => {
    it('ignora em silêncio', async () => {
      await build().publish([
        {
          name: 'AlgoQueNaoTratamos',
          aggregateId: 'x',
          occurredAt: AT,
          payload: () => ({}),
        },
      ]);

      expect(emails.sent).toHaveLength(0);
    });
  });

  describe('injeção de HTML', () => {
    it('escapa o nome antes de montar o corpo', async () => {
      // `GuestName` já recusa `<` e `>`, mas a defesa pertence a quem monta o
      // HTML: se a invariante do nome afrouxar, o template não vira buraco.
      const account = GuestAccount.create({
        provider: 'google',
        subject: 'google|2',
        email: 'x.y@gmail.com',
        displayName: 'x',
      });
      const nome = GuestName.create("D'Ávila Souza");

      await build().publish([new RsvpConfirmed(ID, nome, account, AT)]);

      expect(emails.sent[1]?.html).toContain('&#39;');
      expect(emails.sent[1]?.html).not.toContain("D'Ávila Souza");
    });
  });
});
