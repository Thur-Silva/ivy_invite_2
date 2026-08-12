import { ValueObject } from '@/shared/kernel/value-object';
import { InvalidRespondentIdentityError } from '../errors/invalid-respondent-identity.error';

const SHA256_HEX = /^[0-9a-f]{64}$/;

interface RespondentIdentityProps {
  /** Digest do token do cookie assinado. Sinal mais forte. */
  token: string;
  /** Digest de navegador + SO + idioma + resolução + fuso. */
  device: string;
  /** Digest do endereço de rede. */
  network: string;
}

/**
 * Quem enviou a resposta. Em três sinais, nenhum deles reversível.
 *
 * **Nada aqui é IP, user agent ou token cru.** São digests SHA-256 com salt,
 * produzidos pela porta `RespondentIdentifier`. O domínio recusa qualquer coisa
 * que não tenha cara de digest, e essa recusa é a rede de proteção contra o
 * acidente mais provável desta feature: o convite acabar guardando o IP e o
 * navegador de cada família convidada.
 *
 * ## A regra de igualdade é de negócio, não estrutural
 *
 * Dois registros são a mesma pessoa quando:
 *
 * ```
 * mesmo token   OU   (mesmo aparelho E mesma rede)
 * ```
 *
 * Cada arma cobre a fraqueza da outra:
 *
 * - **token sozinho** é o mais preciso, mas some se a pessoa limpar os cookies
 *   ou abrir em aba anônima;
 * - **aparelho + rede** sobrevive à limpeza de cookies, e exigir os **dois**
 *   juntos é o que impede o falso positivo que IP sozinho causaria: no CGNAT das
 *   operadoras e no Wi-Fi de casa, dezenas de convidados compartilham um IP.
 *   Como a assinatura do aparelho difere entre celulares, cada um responde por si.
 *
 * O caso que ainda escapa: dois aparelhos idênticos, com a mesma configuração,
 * na mesma rede. Raro o bastante para ser aceito conscientemente.
 */
export class RespondentIdentity extends ValueObject<RespondentIdentityProps> {
  private constructor(props: RespondentIdentityProps) {
    super(props);
  }

  static fromDigests(props: RespondentIdentityProps): RespondentIdentity {
    for (const [part, digest] of Object.entries(props)) {
      if (!SHA256_HEX.test(digest)) throw new InvalidRespondentIdentityError(part);
    }
    return new RespondentIdentity(props);
  }

  get token(): string {
    return this.props.token;
  }

  get device(): string {
    return this.props.device;
  }

  get network(): string {
    return this.props.network;
  }

  /**
   * Igualdade de negócio: "é a mesma pessoa respondendo de novo?".
   *
   * Note que **não** é `equals`. `equals` (herdado) compara os três digests e
   * responde "são exatamente a mesma captura"; `isSameRespondentAs` responde a
   * pergunta que o convite realmente faz, e aceita que a rede tenha mudado ou
   * que o cookie tenha sumido.
   *
   * O `NeonRsvpRepository` traduz esta mesma regra para SQL. Se ela mudar aqui,
   * tem de mudar lá. Está anotado nos dois lugares.
   */
  isSameRespondentAs(other: RespondentIdentity): boolean {
    if (this.props.token === other.token) return true;
    return this.props.device === other.device && this.props.network === other.network;
  }
}
