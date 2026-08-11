import type { DomainEvent } from '@/shared/kernel/domain-event';
import type { GuestName } from '../value-objects/guest-name';
import type { RsvpId } from '../value-objects/rsvp-id';

/** A guest answered "vou" for the first time. */
export class RsvpConfirmed implements DomainEvent {
  readonly name = 'RsvpConfirmed' as const;

  constructor(
    private readonly rsvpId: RsvpId,
    private readonly guestName: GuestName,
    readonly occurredAt: Date,
  ) {}

  get aggregateId(): string {
    return this.rsvpId.value;
  }

  payload(): Readonly<Record<string, unknown>> {
    return { rsvpId: this.rsvpId.value, guestName: this.guestName.value };
  }
}
