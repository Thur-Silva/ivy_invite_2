import { DomainError } from '@/shared/kernel/domain-error';

/**
 * Alguém tentou construir uma `RespondentIdentity` com algo que não é digest.
 *
 * Não é erro de convidado. É defeito de programação, e existir como erro de
 * domínio é o que impede o acidente mais provável desta feature: gravar IP,
 * user agent ou token cru no banco por engano.
 */
export class InvalidRespondentIdentityError extends DomainError {
  readonly code = 'INVALID_RESPONDENT_IDENTITY' as const;

  constructor(part: string) {
    super(`O sinal "${part}" precisa ser um digest SHA-256 em hexadecimal.`);
  }
}
