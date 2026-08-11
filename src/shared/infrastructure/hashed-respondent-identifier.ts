import { createHash } from 'node:crypto';
import type {
  RespondentDigests,
  RespondentIdentifier,
  RespondentSignals,
} from '@/shared/application/ports/respondent-identifier';

/**
 * Adapter — SHA-256 com salt sobre cada sinal de identificação.
 *
 * **Por que digest e não o dado cru.** O convite é de uma festa infantil: IP,
 * user agent e resolução de tela de cada convidado são dados pessoais (LGPD,
 * art. 5º I). O digest responde à única pergunta que o sistema faz — "este
 * aparelho já respondeu?" — e não responde a nenhuma outra. Um vazamento do
 * banco não revela de onde ninguém acessou.
 *
 * **Por que o salt.** IPv4 tem 4 bilhões de valores: sem salt, qualquer um com o
 * banco reverte a coluna de rede por força bruta em minutos.
 *
 * **Por que o prefixo por sinal.** Separação de domínio criptográfico: sem ele,
 * um token que por acaso valesse o mesmo texto que um user agent produziria o
 * mesmo digest e os sinais se confundiriam entre colunas.
 */
export class HashedRespondentIdentifier implements RespondentIdentifier {
  constructor(private readonly salt: string) {}

  identify(signals: RespondentSignals): RespondentDigests {
    return {
      token: this.digest('token', signals.sessionToken),
      // Assinatura do aparelho: cabeçalhos que o servidor lê sozinho, mais os
      // traços que o navegador reporta. Sem JavaScript, os traços vêm vazios e a
      // assinatura fica mais fraca — porém estável, que é o que importa.
      device: this.digest(
        'device',
        [signals.userAgent, signals.acceptLanguage, signals.clientTraits].join('~'),
      ),
      network: this.digest('network', signals.networkAddress),
    };
  }

  private digest(scope: string, value: string): string {
    // Normaliza antes: "2001:DB8::1" e "2001:db8::1  " são o mesmo aparelho, e
    // um espaço acidental não pode virar um registro extra.
    const normalized = value.trim().toLowerCase();
    return createHash('sha256').update(`${this.salt}|${scope}|${normalized}`).digest('hex');
  }
}
