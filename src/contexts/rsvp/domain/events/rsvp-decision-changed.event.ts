import type { DomainEvent } from '@/shared/kernel/domain-event';
import type { AttendanceDecision } from '../value-objects/attendance-decision';
import type { GuestAccount } from '../value-objects/guest-account';
import type { GuestName } from '../value-objects/guest-name';
import type { RsvpId } from '../value-objects/rsvp-id';

/** A guest who had already answered changed their mind. */
export class RsvpDecisionChanged implements DomainEvent {
  readonly name = 'RsvpDecisionChanged' as const;

  constructor(
    private readonly rsvpId: RsvpId,
    private readonly guestName: GuestName,
    private readonly account: GuestAccount,
    private readonly previousDecision: AttendanceDecision,
    private readonly currentDecision: AttendanceDecision,
    readonly occurredAt: Date,
  ) {}

  get aggregateId(): string {
    return this.rsvpId.value;
  }

  get guestEmail(): string {
    return this.account.email;
  }

  get guestFirstName(): string {
    return this.guestName.firstName();
  }

  get guestFullName(): string {
    return this.guestName.value;
  }

  /** `true` quando a nova resposta é "vou". Decide o tom do e-mail. */
  get isNowAttending(): boolean {
    return this.currentDecision.isAttending();
  }

  payload(): Readonly<Record<string, unknown>> {
    return {
      rsvpId: this.rsvpId.value,
      guestName: this.guestName.value,
      guestEmail: this.account.email,
      previousDecision: this.previousDecision.value,
      currentDecision: this.currentDecision.value,
    };
  }
}
