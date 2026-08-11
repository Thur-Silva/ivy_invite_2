import { ValueObject } from '@/shared/kernel/value-object';
import { UnknownAttendanceDecisionError } from '../errors/unknown-attendance-decision.error';

/** The two answers the invitation accepts — "vou" / "não vou". */
export const ATTENDANCE_DECISIONS = ['ATTENDING', 'NOT_ATTENDING'] as const;

export type AttendanceDecisionValue = (typeof ATTENDANCE_DECISIONS)[number];

/**
 * Whether the guest is coming to the celebration.
 *
 * Modelled as a Value Object rather than a bare boolean so the domain can name
 * the two states, refuse anything else, and grow a third state later
 * (e.g. `MAYBE`) without touching every call site.
 */
export class AttendanceDecision extends ValueObject<{ value: AttendanceDecisionValue }> {
  static readonly ATTENDING = new AttendanceDecision('ATTENDING');
  static readonly NOT_ATTENDING = new AttendanceDecision('NOT_ATTENDING');

  private constructor(value: AttendanceDecisionValue) {
    super({ value });
  }

  static fromValue(raw: string): AttendanceDecision {
    switch (raw) {
      case 'ATTENDING':
        return AttendanceDecision.ATTENDING;
      case 'NOT_ATTENDING':
        return AttendanceDecision.NOT_ATTENDING;
      default:
        throw new UnknownAttendanceDecisionError(raw);
    }
  }

  get value(): AttendanceDecisionValue {
    return this.props.value;
  }

  isAttending(): boolean {
    return this.props.value === 'ATTENDING';
  }

  toString(): string {
    return this.props.value;
  }
}
