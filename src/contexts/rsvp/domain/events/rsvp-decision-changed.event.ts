import type { DomainEvent } from '@/shared/kernel/domain-event';
import type { AttendanceDecision } from '../value-objects/attendance-decision';
import type { GuestName } from '../value-objects/guest-name';
import type { RsvpId } from '../value-objects/rsvp-id';

/** A guest who had already answered changed their mind. */
export class RsvpDecisionChanged implements DomainEvent {
  readonly name = 'RsvpDecisionChanged' as const;

  constructor(
    private readonly rsvpId: RsvpId,
    private readonly guestName: GuestName,
    private readonly previousDecision: AttendanceDecision,
    private readonly currentDecision: AttendanceDecision,
    readonly occurredAt: Date,
  ) {}

  get aggregateId(): string {
    return this.rsvpId.value;
  }

  payload(): Readonly<Record<string, unknown>> {
    return {
      rsvpId: this.rsvpId.value,
      guestName: this.guestName.value,
      previousDecision: this.previousDecision.value,
      currentDecision: this.currentDecision.value,
    };
  }
}
