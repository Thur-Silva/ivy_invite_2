import type { DomainEvent } from '@/shared/kernel/domain-event';

/**
 * Port — outbound side effects triggered by facts that already happened.
 *
 * Publishing is deliberately fire-and-forget from the caller's perspective:
 * a failure to notify must never fail an RSVP that was already stored. The
 * seam exists so Sprint 2 can add a "notify the hosts on WhatsApp" subscriber
 * without touching the Use Case.
 */
export interface DomainEventPublisher {
  publish(events: readonly DomainEvent[]): Promise<void>;
}
