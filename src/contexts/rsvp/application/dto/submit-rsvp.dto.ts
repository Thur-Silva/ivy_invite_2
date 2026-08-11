import type { AttendanceDecisionValue } from '../../domain/value-objects/attendance-decision';

/**
 * Command crossing into the Application layer.
 *
 * Primitives only: the Presentation layer must not need to know how to build a
 * `GuestName` or an `AttendanceDecision` — translating primitives into Value
 * Objects (and rejecting what cannot be translated) is the Use Case's job.
 */
export interface SubmitRsvpCommand {
  readonly guestName: string;
  readonly decision: string;
}

/** What happened to the guest's answer. */
export type SubmissionStatus =
  /** First answer from this guest. */
  | 'RECORDED'
  /** The guest had answered before and changed their mind. */
  | 'UPDATED'
  /** Same answer as before — nothing changed. */
  | 'UNCHANGED';

/** Read model returned to the Presentation layer. Serializable by design. */
export interface SubmitRsvpOutcome {
  readonly rsvpId: string;
  readonly guestFirstName: string;
  readonly decision: AttendanceDecisionValue;
  readonly status: SubmissionStatus;
}

/** Which form control the user must fix, when the failure is fixable. */
export type SubmitRsvpField = 'guestName' | 'decision';

export type SubmitRsvpFailure =
  | {
      readonly kind: 'VALIDATION';
      readonly code: string;
      readonly message: string;
      readonly field: SubmitRsvpField;
    }
  | {
      readonly kind: 'UNAVAILABLE';
      readonly code: 'RSVP_STORAGE_UNAVAILABLE';
      readonly message: string;
    };
