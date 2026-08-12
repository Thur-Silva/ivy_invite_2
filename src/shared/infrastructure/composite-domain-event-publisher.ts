import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { DomainEvent } from '@/shared/kernel/domain-event';

/**
 * Adapter. Entrega os mesmos eventos a vários assinantes.
 *
 * Existe para que acrescentar notificação por e-mail não custe o log de
 * auditoria que já existia. Os dois assinam, cada um faz o seu.
 *
 * `allSettled` e não `all`: um assinante que falha não pode impedir os outros de
 * rodarem. Um erro no envio de e-mail não deve apagar o registro no log, que é
 * justamente o que sobra para investigar quando algo falha.
 */
export class CompositeDomainEventPublisher implements DomainEventPublisher {
  constructor(private readonly subscribers: readonly DomainEventPublisher[]) {}

  async publish(events: readonly DomainEvent[]): Promise<void> {
    const results = await Promise.allSettled(
      this.subscribers.map((subscriber) => subscriber.publish(events)),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[events] assinante falhou ao publicar', result.reason);
      }
    }
  }
}
