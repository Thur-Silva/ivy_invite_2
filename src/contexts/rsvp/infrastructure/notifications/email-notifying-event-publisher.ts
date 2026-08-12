import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { EmailMessage, EmailSender } from '@/shared/application/ports/email-sender';
import type { DomainEvent } from '@/shared/kernel/domain-event';
import type {
  GetGuestRoster,
  GuestRoster,
} from '../../application/use-cases/get-guest-roster.use-case';
import { RsvpConfirmed } from '../../domain/events/rsvp-confirmed.event';
import { RsvpDeclined } from '../../domain/events/rsvp-declined.event';
import { RsvpDecisionChanged } from '../../domain/events/rsvp-decision-changed.event';
import { adminReportEmail, guestReceiptEmail } from './rsvp-email-templates';

/**
 * Só o método que o relatório usa.
 *
 * Depender do formato, e não da classe, deixa o dublê de teste ser um objeto
 * literal em vez de exigir um repositório inteiro montado só para ler a lista.
 */
type RosterQuery = Pick<GetGuestRoster, 'execute'>;

/** O que cada evento significa para quem escreve os e-mails. */
interface RsvpFact {
  readonly rsvpId: string;
  /** Entra na chave de idempotência. Precisa ser estável e distinto por fato. */
  readonly slug: string;
  readonly guestEmail: string;
  readonly guestFirstName: string;
  readonly guestFullName: string;
  readonly attending: boolean;
  readonly changed: boolean;
}

/**
 * Adapter. Transforma evento de domínio em e-mail.
 *
 * Encaixa no `DomainEventPublisher`, que existia desde o Sprint 1 exatamente para
 * isto. `SubmitRsvp` não sabe que e-mail existe.
 *
 * ## Dois destinatários, dois propósitos opostos
 *
 * **Convidado** recebe um recibo e nada mais: nenhuma regra, nenhum número,
 * nenhuma instrução. Ele já viu a confirmação na tela; o e-mail é cortesia.
 *
 * **Admin** recebe relatório: quem acabou de responder, os totais, o gráfico e a
 * lista completa. É quem fecha número com buffet, e abrir o `db:studio` a cada
 * resposta não é uma opção realista.
 *
 * Os dois saem mesmo quando caem na mesma caixa de entrada. Não são duplicata:
 * um responde "sua presença está registrada", o outro responde "eis a lista".
 *
 * ## A lista é lida na hora de escrever
 *
 * O relatório precisa do estado atual, que o evento não carrega, e nem deveria:
 * evento é fato pontual. Por isso o publisher consulta `GetGuestRoster`, um caso
 * de uso de leitura. Se a consulta falhar, o relatório sai **sem** o gráfico em
 * vez de não sair: saber que alguém respondeu vale mais que o gráfico.
 *
 * ## Idempotência derivada do fato, nunca da tentativa
 *
 * `rsvp-<id>-<fato>-<destino>`. Reexecutar a Server Action, ou o mesmo evento
 * chegar duas vezes, faz o serviço responder `replayed: true` sem mandar nada.
 *
 * Consequência aceita: confirmar, recusar e confirmar de novo dentro dos 15
 * minutos da janela reusa a chave e o segundo aviso não sai. O estado final está
 * certo na tela e no banco; preferimos isso a arriscar duplicata.
 */
export class EmailNotifyingEventPublisher implements DomainEventPublisher {
  constructor(
    private readonly deps: {
      readonly emails: EmailSender;
      readonly invitationUrl: string;
      /** Vazio = ninguém recebe relatório, e o recibo do convidado segue saindo. */
      readonly adminRecipients: readonly string[];
      /** Ausente = relatório sai sem gráfico nem lista. */
      readonly roster?: RosterQuery;
      readonly correlationId?: string;
    },
  ) {}

  async publish(events: readonly DomainEvent[]): Promise<void> {
    const facts = events.map((event) => toFact(event)).filter((fact) => fact !== null);
    if (facts.length === 0) return;

    // Uma leitura para o lote inteiro. Publicar dois eventos do mesmo envio é
    // raro, mas consultar a lista duas vezes seria desperdício garantido.
    const roster = this.deps.adminRecipients.length > 0 ? await this.loadRoster() : null;

    const messages = facts.flatMap((fact) => this.messagesFor(fact, roster));

    // `allSettled`, não `all`: um e-mail que falha não pode impedir o outro. O
    // recibo do convidado importa mesmo que o relatório tenha falhado.
    const results = await Promise.allSettled(messages.map((message) => this.dispatch(message)));

    const crashed = results.filter((result) => result.status === 'rejected');
    if (crashed.length > 0) {
      console.error(`[rsvp] ${crashed.length} envio(s) de e-mail estouraram`, crashed);
    }
  }

  /** Nunca propaga: sem lista, o relatório degrada em vez de não sair. */
  private async loadRoster(): Promise<GuestRoster | null> {
    if (this.deps.roster === undefined) return null;

    try {
      return await this.deps.roster.execute();
    } catch (error) {
      console.error('[email] não foi possível ler a lista para o relatório', error);
      return null;
    }
  }

  /**
   * Envia e registra o desfecho.
   *
   * Nunca relança. `publish` roda depois da resposta ao convidado, então ninguém
   * está esperando: a única coisa útil a fazer com uma falha é deixar rastro
   * suficiente para investigar. `requestId` é a chave de busca no log de quem
   * opera o serviço.
   */
  private async dispatch(message: EmailMessage): Promise<void> {
    const result = await this.deps.emails.send(message);

    if (result.ok) {
      console.info(
        `[email] enviado key=${message.idempotencyKey} messageId=${result.value.messageId} ` +
          `requestId=${result.value.requestId} replayed=${String(result.value.replayed)}`,
      );
      if (result.value.rejected.length > 0) {
        console.warn(
          `[email] endereços recusados na hora: ${result.value.rejected.join(', ')} ` +
            `requestId=${result.value.requestId}`,
        );
      }
      return;
    }

    // Falha permanente merece barulho: não melhora sozinha e quase sempre é dado
    // ruim ou credencial errada. Transiente já esgotou as retentativas.
    const level = result.error.kind === 'PERMANENT' ? console.error : console.warn;
    level(
      `[email] FALHOU (${result.error.kind}) key=${message.idempotencyKey} ` +
        `code=${result.error.code} requestId=${result.error.requestId ?? 'n/d'}: ${result.error.message}`,
    );
  }

  private messagesFor(fact: RsvpFact, roster: GuestRoster | null): EmailMessage[] {
    // O recibo sai sempre, inclusive quando quem respondeu também é admin.
    // Chegou a ser suprimido nesse caso, em nome de reduzir volume, e foi um
    // erro: os dois e-mails dizem coisas diferentes. O recibo é a cortesia que o
    // convidado recebe pela resposta dele; o relatório é ferramenta de quem
    // organiza. Quem acumula os dois papéis quer as duas coisas.
    const messages: EmailMessage[] = [
      this.compose({
        to: [fact.guestEmail],
        rendered: guestReceiptEmail({
          firstName: fact.guestFirstName,
          attending: fact.attending,
          invitationUrl: this.deps.invitationUrl,
        }),
        idempotencyKey: `rsvp-${fact.rsvpId}-${fact.slug}-convidado`,
      }),
    ];

    if (this.deps.adminRecipients.length > 0) {
      const report = adminReportEmail({
        guestName: fact.guestFullName,
        guestEmail: fact.guestEmail,
        attending: fact.attending,
        changed: fact.changed,
        roster,
        invitationUrl: this.deps.invitationUrl,
      });

      messages.push(
        this.compose({
          to: this.deps.adminRecipients,
          rendered: report,
          idempotencyKey: `rsvp-${fact.rsvpId}-${fact.slug}-admin`,
          // Responder o relatório escreve direto para quem respondeu, não para a
          // caixa do serviço de mensageria.
          replyTo: fact.guestEmail,
        }),
      );
    }

    return messages;
  }

  private compose(input: {
    to: readonly string[];
    rendered: { subject: string; html: string; text: string };
    idempotencyKey: string;
    replyTo?: string;
  }): EmailMessage {
    return {
      to: input.to,
      subject: input.rendered.subject,
      html: input.rendered.html,
      text: input.rendered.text,
      idempotencyKey: input.idempotencyKey,
      ...(input.replyTo === undefined ? {} : { replyTo: input.replyTo }),
      ...(this.deps.correlationId === undefined
        ? {}
        : { correlationId: this.deps.correlationId }),
    };
  }
}

/**
 * Normaliza os três eventos numa forma só.
 *
 * Antes cada um tinha seu próprio bloco quase idêntico. Reduzir a um `RsvpFact`
 * deixa uma única descrição de "quem recebe o quê", em vez de três que precisam
 * ser mantidas em sincronia.
 *
 * Evento que este assinante não trata devolve `null` e é ignorado em silêncio: o
 * publisher de log já registrou o fato.
 */
function toFact(event: DomainEvent): RsvpFact | null {
  if (event instanceof RsvpConfirmed) {
    return {
      rsvpId: event.aggregateId,
      slug: 'confirmado',
      guestEmail: event.guestEmail,
      guestFirstName: event.guestFirstName,
      guestFullName: event.guestFullName,
      attending: true,
      changed: false,
    };
  }

  if (event instanceof RsvpDeclined) {
    return {
      rsvpId: event.aggregateId,
      slug: 'recusado',
      guestEmail: event.guestEmail,
      guestFirstName: event.guestFirstName,
      guestFullName: event.guestFullName,
      attending: false,
      changed: false,
    };
  }

  if (event instanceof RsvpDecisionChanged) {
    return {
      rsvpId: event.aggregateId,
      slug: 'alterado',
      guestEmail: event.guestEmail,
      guestFirstName: event.guestFirstName,
      guestFullName: event.guestFullName,
      attending: event.isNowAttending,
      changed: true,
    };
  }

  return null;
}
