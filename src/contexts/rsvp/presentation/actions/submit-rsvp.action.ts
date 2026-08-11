'use server';

import { makeSubmitRsvp } from '../../infrastructure/composition-root';
import {
  RSVP_FIELD_NAMES,
  rsvpFormSchema,
  type RsvpFormState,
  type RsvpFormValues,
} from '../rsvp-form.contract';

/**
 * Driving adapter — the HTTP edge of the RSVP Bounded Context.
 *
 * The only thing this function is allowed to do: translate a `FormData` payload
 * into a Command, hand it to the Use Case, and translate the `Result` back into
 * view state. No business rule, no SQL, no `if` about attendance. Because it is
 * a Server Action, the browser reaches it by POST and the form keeps working
 * with JavaScript disabled.
 */
export async function submitRsvpAction(
  _previousState: RsvpFormState,
  formData: FormData,
): Promise<RsvpFormState> {
  const values: RsvpFormValues = {
    guestName: String(formData.get(RSVP_FIELD_NAMES.guestName) ?? ''),
    decision: String(formData.get(RSVP_FIELD_NAMES.decision) ?? ''),
  };

  const payload = rsvpFormSchema.safeParse(values);

  if (!payload.success) {
    // The shape is wrong, which in practice means the guest submitted without
    // tapping "Vou" or "Não vou".
    return {
      status: 'invalid',
      field: 'decision',
      message: 'Toque em "Eu vou!" ou "Não vou poder" antes de enviar.',
      values,
    };
  }

  const result = await makeSubmitRsvp().execute(payload.data);

  if (!result.ok) {
    if (result.error.kind === 'VALIDATION') {
      return {
        status: 'invalid',
        field: result.error.field,
        message: result.error.message,
        values,
      };
    }

    return { status: 'failed', message: result.error.message, values };
  }

  return {
    status: 'success',
    guestFirstName: result.value.guestFirstName,
    decision: result.value.decision,
    submission: result.value.status,
  };
}
