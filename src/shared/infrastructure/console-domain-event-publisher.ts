import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { DomainEvent } from '@/shared/kernel/domain-event';

/**
 * Adapter. Writes domain events to the platform log (Vercel Runtime Logs).
 *
 * Deliberately the simplest thing that could possibly work for Sprint 1: it
 * gives the hosts an auditable trail and keeps the publishing seam exercised,
 * so swapping in a WhatsApp/e-mail subscriber later is a one-line change in the
 * composition root and touches no business code.
 */
export class ConsoleDomainEventPublisher implements DomainEventPublisher {
  async publish(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      console.info(
        `[domain-event] ${event.name} aggregate=${event.aggregateId} at=${event.occurredAt.toISOString()}`,
        event.payload(),
      );
    }
  }
}
