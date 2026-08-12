import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { DomainEvent } from '@/shared/kernel/domain-event';

/** Qualquer coisa com cara de e-mail dentro de um valor de payload. */
const EMAIL_SHAPED = /([^\s@]{1,2})[^\s@]*@([^\s@]+)/g;

/**
 * Adapter. Escreve os eventos de domínio no log da plataforma (Vercel Runtime Logs).
 *
 * Dá aos anfitriões uma trilha auditável de quem respondeu quando, e mantém o
 * seam de publicação exercitado. Continua no ar depois da integração de e-mail:
 * quando um envio falha, este log é o que sobra para investigar.
 *
 * ## E-mail é mascarado antes de ir para o log
 *
 * Desde que os eventos passaram a carregar o e-mail da conta (para o assinante de
 * notificação saber para quem escrever), o payload tem dado pessoal. Log de
 * plataforma é retido, indexado e visível para quem tem acesso ao projeto, e não
 * é lugar de guardar o e-mail de cada família convidada.
 *
 * `maria.clara@gmail.com` vira `ma***@gmail.com`: o suficiente para reconhecer de
 * quem se trata ao investigar, insuficiente para reconstruir a lista. O e-mail
 * inteiro continua disponível a quem precisa dele de fato, que é o assinante de
 * envio.
 */
export class ConsoleDomainEventPublisher implements DomainEventPublisher {
  async publish(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      console.info(
        `[domain-event] ${event.name} aggregate=${event.aggregateId} at=${event.occurredAt.toISOString()}`,
        maskEmails(event.payload()),
      );
    }
  }
}

function maskEmails(payload: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    masked[key] = typeof value === 'string' ? value.replace(EMAIL_SHAPED, '$1***@$2') : value;
  }

  return masked;
}
