import { ValueObject } from '@/shared/kernel/value-object';
import { InvalidGuestNameError } from '../errors/invalid-guest-name.error';
import { GuestKey } from './guest-key';

const MIN_LENGTH = 2;
const MAX_LENGTH = 60;

/** Letters (any script, incl. accents), spaces, hyphen, apostrophe and dot. */
const ALLOWED_CHARACTERS = new RegExp("^[\\p{L}\\p{M} .'-]+$", 'u');
/** At least one actual letter. Rejects inputs like "..." or "--". */
const HAS_LETTER = new RegExp('\\p{L}', 'u');

/**
 * The name the guest signs the invitation with.
 *
 * Invariants enforced at construction:
 *  - not blank once trimmed;
 *  - between 2 and 60 characters;
 *  - only letters, spaces, hyphen, apostrophe and dot (no digits, no emoji,
 *    no URLs. This is the first line of defence against form spam);
 *  - inner whitespace collapsed, so "Maria   Clara" is stored as "Maria Clara".
 */
export class GuestName extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(raw: string): GuestName {
    const collapsed = raw.replace(/\s+/g, ' ').trim();

    if (collapsed.length === 0) throw InvalidGuestNameError.blank();
    if (collapsed.length < MIN_LENGTH) throw InvalidGuestNameError.tooShort(MIN_LENGTH);
    if (collapsed.length > MAX_LENGTH) throw InvalidGuestNameError.tooLong(MAX_LENGTH);
    if (!ALLOWED_CHARACTERS.test(collapsed)) throw InvalidGuestNameError.invalidCharacters();
    if (!HAS_LETTER.test(collapsed)) throw InvalidGuestNameError.invalidCharacters();

    return new GuestName(collapsed);
  }

  get value(): string {
    return this.props.value;
  }

  /** The natural key used to recognise a returning guest. */
  key(): GuestKey {
    return GuestKey.deriveFrom(this.props.value);
  }

  /** First word. Used by the Presentation layer for a warmer confirmation. */
  firstName(): string {
    return this.props.value.split(' ')[0] ?? this.props.value;
  }

  toString(): string {
    return this.props.value;
  }

  static get constraints(): { minLength: number; maxLength: number } {
    return { minLength: MIN_LENGTH, maxLength: MAX_LENGTH };
  }
}
