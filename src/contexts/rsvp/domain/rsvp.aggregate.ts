import { AggregateRoot } from '@/shared/kernel/aggregate-root';
import { RsvpConfirmed } from './events/rsvp-confirmed.event';
import { RsvpDeclined } from './events/rsvp-declined.event';
import { RsvpDecisionChanged } from './events/rsvp-decision-changed.event';
import type { AttendanceDecision } from './value-objects/attendance-decision';
import type { GuestKey } from './value-objects/guest-key';
import type { GuestName } from './value-objects/guest-name';
import type { RsvpId } from './value-objects/rsvp-id';

interface RsvpState {
  guestName: GuestName;
  decision: AttendanceDecision;
  respondedAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root — one guest's answer to Ivy's invitation.
 *
 * Consistency boundary: a guest (identified by `GuestKey`) has exactly one
 * answer at any time. Answering again is not a new `Rsvp`; it is a state
 * transition on the existing one, which is why the Use Case looks the aggregate
 * up by guest key before deciding to create or to change it.
 *
 * The aggregate never reads the clock or generates ids itself — both arrive as
 * arguments, so its behaviour is fully deterministic and unit-testable.
 */
export class Rsvp extends AggregateRoot<RsvpId> {
  private state: RsvpState;

  private constructor(id: RsvpId, state: RsvpState) {
    super(id);
    this.state = state;
  }

  /** First answer from this guest. Raises `RsvpConfirmed` / `RsvpDeclined`. */
  static submit(input: {
    id: RsvpId;
    guestName: GuestName;
    decision: AttendanceDecision;
    respondedAt: Date;
  }): Rsvp {
    const rsvp = new Rsvp(input.id, {
      guestName: input.guestName,
      decision: input.decision,
      respondedAt: input.respondedAt,
      updatedAt: input.respondedAt,
    });

    rsvp.record(
      input.decision.isAttending()
        ? new RsvpConfirmed(input.id, input.guestName, input.respondedAt)
        : new RsvpDeclined(input.id, input.guestName, input.respondedAt),
    );

    return rsvp;
  }

  /**
   * Rebuilds an aggregate already stored by the repository.
   * Raises no events: replaying history is not new behaviour.
   */
  static rehydrate(input: {
    id: RsvpId;
    guestName: GuestName;
    decision: AttendanceDecision;
    respondedAt: Date;
    updatedAt: Date;
  }): Rsvp {
    return new Rsvp(input.id, {
      guestName: input.guestName,
      decision: input.decision,
      respondedAt: input.respondedAt,
      updatedAt: input.updatedAt,
    });
  }

  /**
   * The guest changed their mind. Idempotent: re-sending the same answer is a
   * no-op and raises no event, so a double tap on the button is harmless.
   *
   * The stored name is refreshed too ("maria clara" -> "Maria Clara"), because
   * the guest key is case- and accent-insensitive while the displayed name
   * should honour the latest spelling the guest chose.
   */
  reconsider(input: { guestName: GuestName; decision: AttendanceDecision; changedAt: Date }): void {
    const sameDecision = this.state.decision.equals(input.decision);
    const sameName = this.state.guestName.equals(input.guestName);

    if (sameDecision && sameName) return;

    const previousDecision = this.state.decision;

    this.state = {
      ...this.state,
      guestName: input.guestName,
      decision: input.decision,
      updatedAt: input.changedAt,
    };

    if (!sameDecision) {
      this.record(
        new RsvpDecisionChanged(
          this.id,
          input.guestName,
          previousDecision,
          input.decision,
          input.changedAt,
        ),
      );
    }
  }

  get guestName(): GuestName {
    return this.state.guestName;
  }

  get guestKey(): GuestKey {
    return this.state.guestName.key();
  }

  get decision(): AttendanceDecision {
    return this.state.decision;
  }

  get respondedAt(): Date {
    return this.state.respondedAt;
  }

  get updatedAt(): Date {
    return this.state.updatedAt;
  }

  isAttending(): boolean {
    return this.state.decision.isAttending();
  }
}
