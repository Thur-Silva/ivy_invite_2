import type { RespondentSignals } from '@/shared/application/ports/respondent-identifier';
import type { AttendanceDecisionValue } from '../../domain/value-objects/attendance-decision';

/**
 * Conta autenticada, como o adapter de entrada a leu **da sessão do servidor**.
 *
 * Nunca vem do formulário. Se viesse, bastaria forjar um campo escondido para
 * responder no lugar de outra pessoa, e o login não valeria nada.
 */
export interface AuthenticatedAccount {
  readonly provider: string;
  readonly subject: string;
  readonly email: string;
  readonly displayName?: string;
}

/**
 * Command crossing into the Application layer.
 *
 * Primitives only: the Presentation layer must not need to know how to build a
 * `GuestName` or an `AttendanceDecision`. Traduzir primitivo em Value Object, e
 * recusar o que não traduz, é trabalho do Use Case.
 */
export interface SubmitRsvpCommand {
  readonly guestName: string;
  readonly decision: string;
  readonly account: AuthenticatedAccount;
  /**
   * Sinais crus de quem está respondendo: IP, user agent, idioma, traços do
   * navegador e token de sessão, como o adapter de entrada os viu.
   *
   * Viram `RespondentIdentity` dentro do caso de uso e **nunca** são persistidos
   * crus: o que chega ao banco são três digests irreversíveis.
   */
  readonly respondent: RespondentSignals;
}

/** What happened to the guest's answer. */
export type SubmissionStatus =
  /** First answer from this guest. */
  | 'RECORDED'
  /** The guest had answered before and changed their mind. */
  | 'UPDATED'
  /** Same answer as before. Nothing changed. */
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
      /** Este nome já respondeu, por outra conta. */
      readonly kind: 'NAME_TAKEN';
      readonly code: 'GUEST_ALREADY_RESPONDED';
      readonly message: string;
    }
  | {
      readonly kind: 'UNAVAILABLE';
      readonly code: 'RSVP_STORAGE_UNAVAILABLE';
      readonly message: string;
    };
