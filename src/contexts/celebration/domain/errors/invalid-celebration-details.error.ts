import { DomainError } from '@/shared/kernel/domain-error';

/**
 * A celebration was described with data that cannot be true.
 *
 * These are configuration mistakes made by the hosts (a typo in the latitude,
 * an end time before the start time), so they must fail loudly at boot rather
 * than render a broken invitation to guests.
 */
export class InvalidCelebrationDetailsError extends DomainError {
  readonly code = 'INVALID_CELEBRATION_DETAILS' as const;

  constructor(message: string) {
    super(message);
  }
}
