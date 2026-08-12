import { z } from 'zod';
import type { AttendanceDecisionValue } from '../domain/value-objects/attendance-decision';
import type { SubmissionStatus, SubmitRsvpField } from '../application/dto/submit-rsvp.dto';

/**
 * Contract shared by the form component and the Server Action.
 *
 * Deliberately thin. Two different jobs, two different places:
 *  - **this schema** validates the *shape* of an HTTP payload (is there a
 *    `decision` field at all, and is it one of the two accepted tokens?);
 *  - **the Domain layer** validates the *rules* (is this a plausible name?).
 *
 * Duplicating the rules here would create a second source of truth that drifts.
 */
export const RSVP_FIELD_NAMES = {
  guestName: 'guestName',
  decision: 'decision',
  /**
   * Campo oculto com os traços do navegador (resolução, densidade, fuso,
   * plataforma). Compõe a assinatura do aparelho junto com os cabeçalhos que o
   * servidor lê sozinho. Vem vazio sem JavaScript, e o envio continua válido.
   */
  deviceTraits: 'deviceTraits',
} as const;

/**
 * The tokens the form may post. `satisfies` makes this a compile-time mirror of
 * the domain Value Object while keeping the import type-only. So no domain
 * code is shipped to the browser.
 */
export const DECISION_OPTIONS = [
  'ATTENDING',
  'NOT_ATTENDING',
] as const satisfies readonly AttendanceDecisionValue[];

/**
 * Mirrors `GuestName.constraints.maxLength`, duplicated here only so the
 * `<input maxLength>` hint does not drag domain code into the browser bundle.
 * `guest-name.spec.ts` asserts the two never drift apart.
 */
export const GUEST_NAME_MAX_LENGTH = 60;

export const rsvpFormSchema = z.object({
  guestName: z.string(),
  decision: z.enum(DECISION_OPTIONS),
});

export interface RsvpFormValues {
  readonly guestName: string;
  readonly decision: string;
}

/** State machine driving the form UI, returned by the Server Action. */
export type RsvpFormState =
  | { readonly status: 'idle' }
  | {
      readonly status: 'success';
      readonly guestFirstName: string;
      readonly decision: AttendanceDecisionValue;
      readonly submission: SubmissionStatus;
    }
  | {
      /** The guest can fix this: a bad name, a missing choice. */
      readonly status: 'invalid';
      readonly field: SubmitRsvpField;
      readonly message: string;
      readonly values: RsvpFormValues;
    }
  | {
      /**
       * A resposta foi recusada e não há o que corrigir no formulário:
       * este aparelho já respondeu por alguém, ou este nome já respondeu de
       * outro aparelho. O formulário sai de cena e dá lugar a uma explicação.
       */
      readonly status: 'locked';
      readonly reason: 'DEVICE' | 'NAME';
      readonly message: string;
      readonly registeredGuestName?: string;
    }
  | {
      /** Nothing the guest did wrong. Retry is the right advice. */
      readonly status: 'failed';
      readonly message: string;
      readonly values: RsvpFormValues;
    };

export const INITIAL_RSVP_FORM_STATE: RsvpFormState = { status: 'idle' };
