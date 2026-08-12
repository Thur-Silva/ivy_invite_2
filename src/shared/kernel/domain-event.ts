/**
 * Shared Kernel. Domain Event contract.
 *
 * A Domain Event records something that already happened in the domain,
 * expressed in the Ubiquitous Language and named in the past tense
 * (`RsvpConfirmed`, not `ConfirmRsvp`). Events are raised by Aggregate Roots
 * and published by the Application layer after the transaction succeeds.
 */
export interface DomainEvent {
  /** Event name in the Ubiquitous Language, past tense. */
  readonly name: string;
  /** Identity of the aggregate instance that raised the event. */
  readonly aggregateId: string;
  /** When the fact happened (supplied by a Clock, never by `new Date()`). */
  readonly occurredAt: Date;
  /** Serializable body, safe to ship to a message bus or a log. */
  payload(): Readonly<Record<string, unknown>>;
}
