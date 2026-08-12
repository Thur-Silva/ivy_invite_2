import { describe, expect, it } from 'vitest';
import { InvalidGuestAccountError } from '../errors/invalid-guest-account.error';
import { GuestAccount } from './guest-account';

const base = {
  provider: 'google',
  subject: 'google|1001',
  email: 'arthur.cruz@empresa.com.br',
  displayName: 'Arthur Cruz',
};

const account = (overrides: Partial<typeof base> = {}) =>
  GuestAccount.create({ ...base, ...overrides });

describe('GuestAccount', () => {
  it('normaliza provedor e e-mail', () => {
    const created = account({ provider: 'GoOgLe', email: '  Maria.Clara@GMAIL.com ' });

    expect(created.provider).toBe('GOOGLE');
    expect(created.email).toBe('maria.clara@gmail.com');
  });

  it.each([
    ['provedor não suportado', { provider: 'twitter' }],
    ['Facebook, que foi descontinuado', { provider: 'facebook' }],
    ['sem identificador', { subject: '   ' }],
    ['e-mail sem arroba', { email: 'arthur.cruz' }],
    ['e-mail sem domínio', { email: 'arthur@' }],
  ])('recusa %s', (_label, overrides) => {
    expect(() => account(overrides)).toThrow(InvalidGuestAccountError);
  });

  describe('primeiro nome sugerido para preencher o formulário', () => {
    it.each([
      ['arthur.cruz@empresa.com', 'Arthur'],
      ['maria_clara@gmail.com', 'Maria'],
      ['joao-pedro@outlook.com', 'Joao'],
      ['ANA@provedor.com', 'Ana'],
      ['bruna2024@gmail.com', 'Bruna'],
      ['rafael.souza.neto@empresa.com.br', 'Rafael'],
    ])('deduz de %s o nome %s', (email, expected) => {
      expect(account({ email }).suggestedFirstName()).toBe(expected);
    });

    it('cai para o nome do provedor quando o e-mail não ajuda', () => {
      // "contato" tem letras mas não é nome; o teste real é o e-mail cifrado.
      expect(
        account({ email: 'a1b2c3@gmail.com', displayName: 'Carla Menezes' }).suggestedFirstName(),
      ).toBe('Carla');
    });

    it('devolve vazio quando nem o e-mail nem o perfil ajudam', () => {
      // Campo fica em branco e a pessoa digita. Melhor que um palpite errado.
      expect(account({ email: 'x1@gmail.com', displayName: '' }).suggestedFirstName()).toBe('');
    });

    it('produz sempre um nome que o domínio aceita', async () => {
      const { GuestName } = await import('./guest-name');

      for (const email of ['arthur.cruz@x.com', 'MARIA_CLARA@y.com', 'joao-pedro9@z.com']) {
        const suggestion = account({ email }).suggestedFirstName();
        expect(() => GuestName.create(suggestion)).not.toThrow();
      }
    });
  });
});
