import type { Clock } from '@/shared/application/ports/clock';
import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { IdGenerator } from '@/shared/application/ports/id-generator';
import type { DomainEvent } from '@/shared/kernel/domain-event';

/** Time stands still, so assertions on timestamps are exact. */
export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

/** Predictable ids: `rsvp-1`, `rsvp-2`, … */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = 'rsvp') {}

  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}

/** Spy that keeps every published event so tests can assert on them. */
export class RecordingEventPublisher implements DomainEventPublisher {
  readonly published: DomainEvent[] = [];

  async publish(events: readonly DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }

  names(): string[] {
    return this.published.map((event) => event.name);
  }
}
