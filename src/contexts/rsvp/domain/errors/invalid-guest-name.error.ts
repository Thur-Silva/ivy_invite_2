import { DomainError } from '@/shared/kernel/domain-error';

/** Reason a proposed guest name violated the `GuestName` invariant. */
export type InvalidGuestNameReason = 'BLANK' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_CHARACTERS';

export class InvalidGuestNameError extends DomainError {
  readonly code = 'INVALID_GUEST_NAME' as const;

  private constructor(
    readonly reason: InvalidGuestNameReason,
    message: string,
  ) {
    super(message);
  }

  static blank(): InvalidGuestNameError {
    return new InvalidGuestNameError('BLANK', 'O nome do convidado não pode ficar em branco.');
  }

  static tooShort(minLength: number): InvalidGuestNameError {
    return new InvalidGuestNameError(
      'TOO_SHORT',
      `O nome do convidado precisa ter ao menos ${minLength} letras.`,
    );
  }

  static tooLong(maxLength: number): InvalidGuestNameError {
    return new InvalidGuestNameError(
      'TOO_LONG',
      `O nome do convidado pode ter no máximo ${maxLength} letras.`,
    );
  }

  static invalidCharacters(): InvalidGuestNameError {
    return new InvalidGuestNameError(
      'INVALID_CHARACTERS',
      'O nome do convidado aceita apenas letras, espaços, hífen e apóstrofo.',
    );
  }
}
