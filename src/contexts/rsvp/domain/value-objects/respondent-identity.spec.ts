import { describe, expect, it } from 'vitest';
import { InvalidRespondentIdentityError } from '../errors/invalid-respondent-identity.error';
import { RespondentIdentity } from './respondent-identity';

const digest = (seed: string): string => seed.repeat(64).slice(0, 64);

const TOKEN = digest('a');
const DEVICE = digest('b');
const NETWORK = digest('c');

function identity(overrides: Partial<Record<'token' | 'device' | 'network', string>> = {}) {
  return RespondentIdentity.fromDigests({
    token: TOKEN,
    device: DEVICE,
    network: NETWORK,
    ...overrides,
  });
}

describe('RespondentIdentity', () => {
  describe('recusa qualquer coisa que não seja digest', () => {
    it.each([
      ['IP cru', '189.10.10.1'],
      ['user agent', 'Mozilla/5.0 (iPhone)'],
      ['hash curto demais', 'abc123'],
      ['hexadecimal maiúsculo', digest('A')],
      ['vazio', ''],
    ])('rejeita %s', (_label, value) => {
      expect(() => identity({ network: value })).toThrow(InvalidRespondentIdentityError);
    });
  });

  describe('isSameRespondentAs', () => {
    it('reconhece pelo token, mesmo que aparelho e rede tenham mudado', () => {
      // Trocou de celular e de operadora, mas o cookie veio junto.
      const later = identity({ device: digest('d'), network: digest('e') });

      expect(identity().isSameRespondentAs(later)).toBe(true);
    });

    it('reconhece por aparelho + rede quando o cookie sumiu', () => {
      const afterClearingCookies = identity({ token: digest('9') });

      expect(identity().isSameRespondentAs(afterClearingCookies)).toBe(true);
    });

    it('NÃO reconhece só pela rede. É o que salva o Wi-Fi de casa', () => {
      // Mesmo IP (CGNAT ou Wi-Fi compartilhado), celulares diferentes.
      const otherPhoneSameWifi = identity({ token: digest('9'), device: digest('d') });

      expect(identity().isSameRespondentAs(otherPhoneSameWifi)).toBe(false);
    });

    it('NÃO reconhece só pelo aparelho quando a rede difere e o cookie sumiu', () => {
      const sameModelElsewhere = identity({ token: digest('9'), network: digest('e') });

      expect(identity().isSameRespondentAs(sameModelElsewhere)).toBe(false);
    });

    it('é simétrica', () => {
      const other = identity({ token: digest('9') });

      expect(identity().isSameRespondentAs(other)).toBe(other.isSameRespondentAs(identity()));
    });
  });
});
