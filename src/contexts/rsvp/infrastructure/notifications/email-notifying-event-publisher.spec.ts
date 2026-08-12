import { beforeEach, describe, expect, it } from 'vitest';
import type {
  EmailFailure,
  EmailMessage,
  EmailReceipt,
  EmailSender,
} from '@/shared/application/ports/email-sender';
import { fail, ok, type Result } from '@/shared/kernel/result';
import type { GuestRoster } from '../../application/use-cases/get-guest-roster.use-case';
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

/** Lista já pronta: o publisher só precisa saber ler, não montar. */
const ROSTER: GuestRoster = {
  entries: [
    { name: 'Maria Clara Souza', attending: true, respondedAtIso: AT.toISOString() },
    { name: 'João Pedro', attending: false, respondedAtIso: AT.toISOString() },
    { name: 'Ana Beatriz', attending: true, respondedAtIso: AT.toISOString() },
  ],
  attendingCount: 2,
  notAttendingCount: 1,
  total: 3,
  attendingPercent: 67,
};

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

  const build = (
    options: {
      adminRecipients?: readonly string[];
      roster?: { execute(): Promise<GuestRoster> };
    } = {},
  ) =>
    new EmailNotifyingEventPublisher({
      emails,
      invitationUrl: 'https://ivy-invite-2.vercel.app',
      adminRecipients: options.adminRecipients ?? ['mae@ivy.test', 'pai@ivy.test'],
      ...(options.roster === undefined ? {} : { roster: options.roster }),
    });

  /** Publisher com a lista carregada, que é a montagem de produção. */
  const buildWithRoster = (roster: GuestRoster = ROSTER) =>
    build({ roster: { execute: async () => roster } });

  beforeEach(() => {
    emails = new RecordingEmailSender();
  });

  describe('RsvpConfirmed', () => {
    it('escreve para o convidado e para o admin', async () => {
      await build().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      expect(emails.sent).toHaveLength(2);

      const [convidado, admin] = emails.sent;
      expect(convidado?.to).toEqual(['maria.clara@gmail.com']);
      expect(convidado?.subject).toContain('confirmada');
      expect(convidado?.html).toContain('Maria');

      expect(admin?.to).toEqual(['mae@ivy.test', 'pai@ivy.test']);
      expect(admin?.subject).toContain('Maria Clara Souza');
      // Responder o relatório fala com quem confirmou, não com a caixa do serviço.
      expect(admin?.replyTo).toBe('maria.clara@gmail.com');
    });

    it('deriva a chave de idempotência do fato, não da tentativa', async () => {
      await build().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      expect(emails.sent.map((message) => message.idempotencyKey)).toEqual([
        'rsvp-rsvp-1-confirmado-convidado',
        'rsvp-rsvp-1-confirmado-admin',
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
      await buildWithRoster().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      for (const message of emails.sent) {
        expect(message.text).toBeTruthy();
        // Sem marcação e sem entidade escapada: quem lê em texto puro merece
        // texto puro, não `&#39;` no meio da frase.
        expect(message.text).not.toContain('<');
        expect(message.text).not.toContain('&#');
        expect(message.text).toContain('https://ivy-invite-2.vercel.app');
      }
    });
  });

  /**
   * O recibo do convidado perdeu de propósito tudo que é regra ou número. Ele já
   * viu a confirmação na tela; o e-mail é cortesia, e cortesia não vem com
   * relatório nem com manual de uso.
   */
  describe('recibo do convidado', () => {
    beforeEach(async () => {
      await buildWithRoster().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);
    });

    it('não carrega nenhuma regra de negócio', async () => {
      const convidado = emails.sent[0];

      expect(convidado?.html).not.toMatch(/uma resposta por|mudou de ideia|não pode confirmar/i);
      expect(convidado?.text).not.toMatch(/uma resposta por|mudou de ideia/i);
    });

    it('não mostra número nem lista de ninguém', async () => {
      const convidado = emails.sent[0];

      expect(convidado?.html).not.toMatch(/confirmados|responderam|João Pedro|Ana Beatriz/i);
      // Privacidade antes de tudo: o convidado não recebe a lista dos outros.
      expect(convidado?.text).not.toContain('Ana Beatriz');
    });

    it('não repete data nem endereço, só aponta para o convite', async () => {
      const convidado = emails.sent[0];

      expect(convidado?.html).toContain('https://ivy-invite-2.vercel.app');
      // Detalhe da festa envelhece na caixa de entrada. O convite é a fonte.
      expect(convidado?.html).not.toMatch(/setembro|Estrada|Extrema/i);
    });
  });

  describe('relatório do admin', () => {
    it('nomeia quem acabou de responder e traz os totais', async () => {
      await buildWithRoster().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      const admin = emails.sent[1];
      expect(admin?.subject).toBe('Maria Clara Souza confirmou presença (2 confirmados)');
      expect(admin?.html).toContain('Maria Clara Souza');
      expect(admin?.text).toContain('2 vão, 1 não vão, 3 responderam');
    });

    it('desenha o gráfico com largura proporcional, sem imagem externa', async () => {
      await buildWithRoster().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      const html = emails.sent[1]?.html ?? '';
      // Barra empilhada em tabela: as duas fatias somam a largura toda.
      expect(html).toContain('width="67%"');
      expect(html).toContain('width="33%"');
      // Nenhum PNG gerado por serviço de terceiro, que é como gráfico de e-mail
      // costuma ser feito e como ele costuma quebrar.
      expect(html).not.toContain('<img');
      expect(html).not.toContain('chart');
    });

    it('lista todos os nomes com vai/não vai', async () => {
      await buildWithRoster().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      const admin = emails.sent[1];
      for (const entry of ROSTER.entries) {
        expect(admin?.html).toContain(entry.name);
        expect(admin?.text).toContain(entry.name);
      }
      expect(admin?.text).toContain('[VAI]');
      expect(admin?.text).toContain('[NAO VAI]');
    });

    it('destaca quem respondeu agora dentro da lista', async () => {
      await buildWithRoster().publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      expect(emails.sent[1]?.html).toContain('AGORA');
    });

    it('sai sem gráfico, e não deixa de sair, quando a lista falha', async () => {
      const publisher = build({
        roster: {
          execute: async () => {
            throw new Error('banco indisponível');
          },
        },
      });

      await publisher.publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      // Saber que alguém respondeu vale mais que o gráfico.
      expect(emails.sent).toHaveLength(2);
      const admin = emails.sent[1];
      expect(admin?.subject).toBe('Maria Clara Souza confirmou presença');
      expect(admin?.html).toContain('Não foi possível ler a lista');
      expect(admin?.text).toContain('lista indisponível');
    });

    it('não consulta a lista quando ninguém recebe relatório', async () => {
      let leituras = 0;
      const publisher = build({
        adminRecipients: [],
        roster: {
          execute: async () => {
            leituras += 1;
            return ROSTER;
          },
        },
      });

      await publisher.publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      expect(leituras).toBe(0);
      expect(emails.sent).toHaveLength(1);
    });

    it('lê a lista uma vez só, mesmo com vários eventos no lote', async () => {
      let leituras = 0;
      const publisher = build({
        roster: {
          execute: async () => {
            leituras += 1;
            return ROSTER;
          },
        },
      });

      await publisher.publish([
        new RsvpConfirmed(ID, NAME, ACCOUNT, AT),
        new RsvpDeclined(RsvpId.fromString('rsvp-2'), NAME, ACCOUNT, AT),
      ]);

      expect(leituras).toBe(1);
      expect(emails.sent).toHaveLength(4);
    });

    it('aguenta lista vazia sem inventar gráfico', async () => {
      await buildWithRoster({
        entries: [],
        attendingCount: 0,
        notAttendingCount: 0,
        total: 0,
        attendingPercent: 0,
      }).publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      const html = emails.sent[1]?.html ?? '';
      expect(html).toContain('Nenhuma resposta ainda');
      expect(html).not.toContain('width="0%"');
    });
  });

  describe('RsvpDeclined', () => {
    it('usa tom de recusa e avisa o admin', async () => {
      await build().publish([new RsvpDeclined(ID, NAME, ACCOUNT, AT)]);

      const [convidado, admin] = emails.sent;
      expect(convidado?.subject).toContain('registrada');
      expect(convidado?.html).toContain('Obrigada por avisar');
      expect(admin?.subject).toContain('não vai poder ir');
      expect(emails.sent.map((message) => message.idempotencyKey)).toEqual([
        'rsvp-rsvp-1-recusado-convidado',
        'rsvp-rsvp-1-recusado-admin',
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
      expect(emails.sent[1]?.subject).toContain('confirmou presença');
    });

    it('avisa o admin que houve mudança de ideia', async () => {
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
      // O convidado não precisa saber que o sistema achou isso interessante.
      expect(emails.sent[0]?.html).not.toContain('mudou de ideia');
    });
  });

  /**
   * O recibo já foi suprimido nesse caso, para reduzir volume, e foi um erro:
   * quem organiza a festa também é convidado dela e quer os dois e-mails. Este
   * bloco existe para a economia não ser reintroduzida por engano.
   */
  describe('quando quem responde é o próprio admin', () => {
    const ADMIN_ACCOUNT = GuestAccount.create({
      provider: 'google',
      subject: 'google|9001',
      email: 'mae@ivy.test',
      displayName: 'Marina',
    });

    it('manda os dois, e não só o relatório', async () => {
      await buildWithRoster().publish([new RsvpConfirmed(ID, NAME, ADMIN_ACCOUNT, AT)]);

      expect(emails.sent).toHaveLength(2);
      expect(emails.sent.map((message) => message.idempotencyKey)).toEqual([
        'rsvp-rsvp-1-confirmado-convidado',
        'rsvp-rsvp-1-confirmado-admin',
      ]);
    });

    it('cada um chega com o conteúdo do seu papel', async () => {
      await buildWithRoster().publish([new RsvpConfirmed(ID, NAME, ADMIN_ACCOUNT, AT)]);

      const [recibo, relatorio] = emails.sent;
      expect(recibo?.to).toEqual(['mae@ivy.test']);
      expect(recibo?.html).not.toContain('Ana Beatriz');

      expect(relatorio?.to).toEqual(['mae@ivy.test', 'pai@ivy.test']);
      expect(relatorio?.html).toContain('Ana Beatriz');
    });
  });

  describe('sem admin configurado', () => {
    it('escreve só para o convidado', async () => {
      await build({ adminRecipients: [] }).publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

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
        adminRecipients: ['mae@ivy.test'],
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

    it('escapa o nome também dentro da lista', async () => {
      await buildWithRoster({
        entries: [{ name: `Ana "Aninha" <b>`, attending: true, respondedAtIso: AT.toISOString() }],
        attendingCount: 1,
        notAttendingCount: 0,
        total: 1,
        attendingPercent: 100,
      }).publish([new RsvpConfirmed(ID, NAME, ACCOUNT, AT)]);

      const html = emails.sent[1]?.html ?? '';
      expect(html).toContain('&lt;b&gt;');
      expect(html).not.toContain('<b>');
    });
  });
});
