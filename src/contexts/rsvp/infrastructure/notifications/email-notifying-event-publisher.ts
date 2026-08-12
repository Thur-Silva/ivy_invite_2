import type { EmailMessage, EmailSender } from '@/shared/application/ports/email-sender';
import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { DomainEvent } from '@/shared/kernel/domain-event';
import { RsvpConfirmed } from '../../domain/events/rsvp-confirmed.event';
import { RsvpDeclined } from '../../domain/events/rsvp-declined.event';
import { RsvpDecisionChanged } from '../../domain/events/rsvp-decision-changed.event';
import {
  guestConfirmedEmail,
  guestDeclinedEmail,
  hostNotificationEmail,
} from './rsvp-email-templates';

/**
 * Adapter. Transforma evento de domínio em e-mail.
 *
 * Encaixa no `DomainEventPublisher`, que existia desde o Sprint 1 exatamente para
 * isto. O comentário original da porta dizia que um assinante de notificação
 * entraria "sem tocar no caso de uso", e é o que acontece: `SubmitRsvp` não sabe
 * que e-mail existe.
 *
 * ## Por que é infraestrutura e não aplicação
 *
 * Ele monta HTML e conhece endereços de anfitrião. Corpo de mensagem e destino
 * são detalhe de entrega, não regra. A regra ("quem confirma recebe recibo") está
 * na escolha do evento que dispara cada e-mail, e essa escolha é declarativa
 * aqui, sem `if` de negócio escondido.
 *
 * ## Idempotência derivada do fato, nunca da tentativa
 *
 * `rsvp-<id>-<fato>-<destino>`. Se a Server Action for reexecutada, ou se o mesmo
 * evento chegar duas vezes, o serviço reconhece a chave e responde
 * `replayed: true` sem mandar nada. É a diferença entre um retry seguro e um
 * convidado recebendo o mesmo e-mail três vezes.
 *
 * Uma consequência aceita: se alguém confirma, muda para "não vou" e volta para
 * "vou", o segundo `RsvpDecisionChanged` reusa a chave do primeiro se acontecer
 * dentro dos 15 minutos da janela de idempotência, e o e-mail não sai de novo. O
 * estado final na tela e no banco está certo; o convidado só não recebe o
 * terceiro aviso. Preferimos isso a arriscar duplicata.
 */
export class EmailNotifyingEventPublisher implements DomainEventPublisher {
  constructor(
    private readonly deps: {
      readonly emails: EmailSender;
      readonly invitationUrl: string;
      /** Vazio = ninguém é avisado, e o envio ao convidado segue normal. */
      readonly hostRecipients: readonly string[];
      /** Para o serviço de e-mail amarrar o log dele ao nosso rastro. */
      readonly correlationId?: string;
    },
  ) {}

  async publish(events: readonly DomainEvent[]): Promise<void> {
    const messages = events.flatMap((event) => this.messagesFor(event));

    // `allSettled`, não `all`: um e-mail que falha não pode impedir o outro de
    // sair. O convidado receber o recibo importa mesmo que o aviso ao anfitrião
    // tenha falhado, e vice-versa.
    const results = await Promise.allSettled(messages.map((message) => this.dispatch(message)));

    const crashed = results.filter((result) => result.status === 'rejected');
    if (crashed.length > 0) {
      console.error(`[rsvp] ${crashed.length} envio(s) de e-mail estouraram`, crashed);
    }
  }

  /**
   * Envia e registra o desfecho.
   *
   * Nunca relança. `publish` é chamado depois da resposta ao convidado, então
   * ninguém está esperando: a única coisa útil a fazer com uma falha aqui é
   * deixar rastro suficiente para investigar. `requestId` é a chave de busca no
   * log de quem opera o serviço, e por isso vai no log **e** no alerta.
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

    // Falha permanente merece barulho: não vai melhorar sozinha e quase sempre é
    // dado ruim ou credencial errada. Transiente já esgotou as retentativas.
    const level = result.error.kind === 'PERMANENT' ? console.error : console.warn;
    level(
      `[email] FALHOU (${result.error.kind}) key=${message.idempotencyKey} ` +
        `code=${result.error.code} requestId=${result.error.requestId ?? 'n/d'}: ${result.error.message}`,
    );
  }

  private messagesFor(event: DomainEvent): EmailMessage[] {
    if (event instanceof RsvpConfirmed) {
      return this.fanOut({
        rsvpId: event.aggregateId,
        fact: 'confirmado',
        guestEmail: event.guestEmail,
        guest: guestConfirmedEmail({
          firstName: event.guestFirstName,
          invitationUrl: this.deps.invitationUrl,
        }),
        host: hostNotificationEmail({
          guestFullName: event.guestFullName,
          guestEmail: event.guestEmail,
          isAttending: true,
          changed: false,
          invitationUrl: this.deps.invitationUrl,
        }),
      });
    }

    if (event instanceof RsvpDeclined) {
      return this.fanOut({
        rsvpId: event.aggregateId,
        fact: 'recusado',
        guestEmail: event.guestEmail,
        guest: guestDeclinedEmail({
          firstName: event.guestFirstName,
          invitationUrl: this.deps.invitationUrl,
        }),
        host: hostNotificationEmail({
          guestFullName: event.guestFullName,
          guestEmail: event.guestEmail,
          isAttending: false,
          changed: false,
          invitationUrl: this.deps.invitationUrl,
        }),
      });
    }

    if (event instanceof RsvpDecisionChanged) {
      const guest = event.isNowAttending
        ? guestConfirmedEmail({
            firstName: event.guestFirstName,
            invitationUrl: this.deps.invitationUrl,
          })
        : guestDeclinedEmail({
            firstName: event.guestFirstName,
            invitationUrl: this.deps.invitationUrl,
          });

      return this.fanOut({
        rsvpId: event.aggregateId,
        fact: 'alterado',
        guestEmail: event.guestEmail,
        guest,
        host: hostNotificationEmail({
          guestFullName: event.guestFullName,
          guestEmail: event.guestEmail,
          isAttending: event.isNowAttending,
          changed: true,
          invitationUrl: this.deps.invitationUrl,
        }),
      });
    }

    // Evento que este assinante não trata. Ignorar em silêncio é correto: o
    // publisher de log já registrou o fato.
    return [];
  }

  private fanOut(input: {
    rsvpId: string;
    fact: string;
    guestEmail: string;
    guest: { subject: string; html: string; text: string };
    host: { subject: string; html: string; text: string };
  }): EmailMessage[] {
    const messages: EmailMessage[] = [
      {
        to: [input.guestEmail],
        subject: input.guest.subject,
        html: input.guest.html,
        text: input.guest.text,
        idempotencyKey: `rsvp-${input.rsvpId}-${input.fact}-convidado`,
        ...(this.deps.correlationId === undefined
          ? {}
          : { correlationId: this.deps.correlationId }),
      },
    ];

    if (this.deps.hostRecipients.length > 0) {
      messages.push({
        to: this.deps.hostRecipients,
        subject: input.host.subject,
        html: input.host.html,
        text: input.host.text,
        // `replyTo` no e-mail do convidado: o anfitrião responde o aviso e a
        // mensagem vai direto para quem confirmou, não para a caixa do serviço.
        replyTo: input.guestEmail,
        idempotencyKey: `rsvp-${input.rsvpId}-${input.fact}-anfitriao`,
        ...(this.deps.correlationId === undefined
          ? {}
          : { correlationId: this.deps.correlationId }),
      });
    }

    return messages;
  }
}
