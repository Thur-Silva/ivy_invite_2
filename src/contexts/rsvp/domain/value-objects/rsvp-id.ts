import { Identifier } from '@/shared/kernel/identifier';

/** Identity of an `Rsvp` aggregate. Opaque to every layer but persistence. */
export class RsvpId extends Identifier {
  private constructor(value: string) {
    super({ value });
  }

  static fromString(value: string): RsvpId {
    return new RsvpId(value);
  }
}
