import type { DomainEvent } from './domain-event';
import { Entity } from './entity';
import type { Identifier } from './identifier';

/**
 * Shared Kernel — Aggregate Root base class.
 *
 * The Aggregate Root is the only entry point into an aggregate: it guards the
 * consistency boundary and is the unit of persistence (one repository per
 * aggregate root). It buffers Domain Events raised while its state changed;
 * the Application layer drains them with `pullDomainEvents()` after the
 * transaction commits, so no event is published for work that was rolled back.
 */
export abstract class AggregateRoot<TId extends Identifier> extends Entity<TId> {
  private domainEvents: DomainEvent[] = [];

  protected record(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /** Returns the buffered events and clears the buffer. */
  pullDomainEvents(): readonly DomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];
    return events;
  }
}
