import { ValueObject } from '@/shared/kernel/value-object';

/** Unicode combining diacritical marks, removed after NFD decomposition. */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/**
 * Natural key that identifies a guest across submissions.
 *
 * Derived from a `GuestName` by folding case, stripping diacritics and joining
 * words with hyphens, so "Maria Clara", "maria clara" and "MARIA  CLARA" all
 * resolve to `maria-clara`. This is what makes a second submission from the
 * same guest an update ("mudei de ideia") instead of a duplicate row.
 */
export class GuestKey extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  /** Rehydrates a key already normalized by a previous `deriveFrom` call. */
  static fromNormalized(value: string): GuestKey {
    return new GuestKey(value);
  }

  static deriveFrom(name: string): GuestKey {
    const normalized = name
      .normalize('NFD')
      .replace(COMBINING_MARKS, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return new GuestKey(normalized);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
