import { describe, expect, it } from 'vitest';
import { GUEST_NAME_MAX_LENGTH } from '../../presentation/rsvp-form.contract';
import { InvalidGuestNameError } from '../errors/invalid-guest-name.error';
import { GuestName } from './guest-name';

describe('GuestName', () => {
  it('collapses surrounding and inner whitespace', () => {
    expect(GuestName.create('  Maria   Clara  ').value).toBe('Maria Clara');
  });

  it('accepts Portuguese accents, hyphens and apostrophes', () => {
    for (const name of ['Antônio', 'Ana-Júlia', "D'Ávila", 'José da Conceição']) {
      expect(GuestName.create(name).value).toBe(name);
    }
  });

  it.each([
    ['   ', 'BLANK'],
    ['A', 'TOO_SHORT'],
    ['a'.repeat(GUEST_NAME_MAX_LENGTH + 1), 'TOO_LONG'],
    ['Maria 123', 'INVALID_CHARACTERS'],
    ['Maria 🐸', 'INVALID_CHARACTERS'],
    ['http://spam.example', 'INVALID_CHARACTERS'],
    ['...', 'INVALID_CHARACTERS'],
  ])('rejects %j with reason %s', (input, reason) => {
    expect(() => GuestName.create(input)).toThrow(InvalidGuestNameError);
    try {
      GuestName.create(input);
    } catch (error) {
      expect((error as InvalidGuestNameError).reason).toBe(reason);
      expect((error as InvalidGuestNameError).code).toBe('INVALID_GUEST_NAME');
    }
  });

  describe('natural key', () => {
    it('treats case, accents and spacing as the same guest', () => {
      const spellings = ['Maria Clara', 'maria clara', 'MARIA  CLARA', 'María Clara'];
      const keys = new Set(spellings.map((name) => GuestName.create(name).key().value));

      expect(keys).toEqual(new Set(['maria-clara']));
    });

    it('keeps different guests apart', () => {
      expect(GuestName.create('Ana Paula').key().value).not.toBe(
        GuestName.create('Ana Paulo').key().value,
      );
    });
  });

  it('exposes the first name for a warmer confirmation', () => {
    expect(GuestName.create('Maria Clara Souza').firstName()).toBe('Maria');
  });

  it('keeps the form hint in sync with the invariant', () => {
    // Guards the deliberate duplication documented in rsvp-form.contract.ts.
    expect(GUEST_NAME_MAX_LENGTH).toBe(GuestName.constraints.maxLength);
  });
});
