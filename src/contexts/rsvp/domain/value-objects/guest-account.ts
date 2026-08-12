import { ValueObject } from '@/shared/kernel/value-object';
import { InvalidGuestAccountError } from '../errors/invalid-guest-account.error';

/** Provedores de identidade que o convite aceita. */
export const ACCOUNT_PROVIDERS = ['GOOGLE', 'FACEBOOK'] as const;

export type AccountProviderValue = (typeof ACCOUNT_PROVIDERS)[number];

interface GuestAccountProps {
  provider: AccountProviderValue;
  /** Id da pessoa no provedor. Estável mesmo se o e-mail ou o nome mudarem. */
  subject: string;
  email: string;
  /** Nome como o provedor o conhece. Pode vir vazio no Facebook. */
  displayName: string;
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Separadores comuns em e-mail: arthur.cruz, maria_clara, joao-pedro2. */
const EMAIL_LOCAL_SEPARATORS = /[._\-+0-9]+/;
const ONLY_LETTERS = new RegExp('^\\p{L}+$', 'u');

/**
 * A conta verificada de quem está respondendo.
 *
 * ## O que ela muda no domínio
 *
 * Antes, um convidado era um nome digitado numa caixa. Qualquer um podia
 * escrever qualquer coisa, e o sistema se defendia com heurísticas: chave
 * natural do nome, impressão digital do aparelho, hash do IP. Todas continuam
 * lá, mas passaram a ser rede de proteção secundária.
 *
 * Agora a identidade é **provada por terceiro**. `provider + subject` é o par
 * que identifica a pessoa, e é ele que carrega a regra "uma resposta por
 * convidado". Ninguém precisa de duas contas do Google para ir a uma festa
 * infantil, então a barreira é alta na prática e não custa nada a quem é
 * honesto: dois toques e está dentro.
 *
 * ## Por que o `subject` e não o e-mail
 *
 * E-mail muda. A pessoa troca de provedor, corrige um alias, migra a conta. O
 * `subject` é o identificador interno do Google/Facebook e não muda nunca. Usar
 * e-mail como chave criaria respostas duplicadas no dia em que alguém trocasse.
 */
export class GuestAccount extends ValueObject<GuestAccountProps> {
  private constructor(props: GuestAccountProps) {
    super(props);
  }

  static create(props: {
    provider: string;
    subject: string;
    email: string;
    displayName?: string;
  }): GuestAccount {
    const provider = props.provider.trim().toUpperCase();
    if (!isSupportedProvider(provider)) {
      throw new InvalidGuestAccountError(`provedor "${props.provider}" não é aceito`);
    }

    const subject = props.subject.trim();
    if (subject.length === 0) {
      throw new InvalidGuestAccountError('o provedor não devolveu um identificador');
    }

    const email = props.email.trim().toLowerCase();
    if (!EMAIL_SHAPE.test(email)) {
      throw new InvalidGuestAccountError(`e-mail em formato inesperado: "${props.email}"`);
    }

    return new GuestAccount({
      provider,
      subject,
      email,
      displayName: (props.displayName ?? '').trim(),
    });
  }

  get provider(): AccountProviderValue {
    return this.props.provider;
  }

  get subject(): string {
    return this.props.subject;
  }

  get email(): string {
    return this.props.email;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  /**
   * Primeiro nome sugerido para já vir preenchido no formulário.
   *
   * Tenta o e-mail primeiro, porque foi o pedido: `arthur.cruz@empresa.com` vira
   * "Arthur". A parte local é quebrada nos separadores usuais (ponto,
   * sublinhado, hífen, dígitos) e o primeiro pedaço vira o palpite.
   *
   * Cai para o nome do provedor quando o e-mail não ajuda, que é o caso de
   * `contato@`, `a1b2c3@` ou de uma parte local com uma letra só.
   *
   * Devolve string vazia quando nenhum dos dois serve, e aí o campo fica em
   * branco para a pessoa digitar. **É sempre um palpite editável**, nunca um
   * dado imposto: o nome que vale é o que o convidado confirmar.
   */
  suggestedFirstName(): string {
    const fromEmail = firstWordOf(this.props.email.split('@')[0] ?? '');
    if (fromEmail !== '') return fromEmail;

    const fromProfile = firstWordOf(this.props.displayName);
    if (fromProfile !== '') return fromProfile;

    return '';
  }
}

function isSupportedProvider(value: string): value is AccountProviderValue {
  return (ACCOUNT_PROVIDERS as readonly string[]).includes(value);
}

/** Primeiro pedaço utilizável de um texto, com a inicial em maiúscula. */
function firstWordOf(raw: string): string {
  const candidate = raw
    .trim()
    .split(raw.includes(' ') ? /\s+/ : EMAIL_LOCAL_SEPARATORS)
    .find((part) => part.length >= 2 && ONLY_LETTERS.test(part));

  if (candidate === undefined) return '';

  return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
}
