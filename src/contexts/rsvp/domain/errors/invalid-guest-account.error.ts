import { DomainError } from '@/shared/kernel/domain-error';

/**
 * A conta que chegou não serve para identificar um convidado.
 *
 * Não é erro do convidado, é defeito: a sessão só chega ao domínio depois de o
 * provedor confirmar a identidade. Se algo aqui falha, é porque um dado da
 * sessão veio vazio ou porque alguém tentou montar a conta a partir do
 * formulário, que é justamente o que este Value Object impede.
 */
export class InvalidGuestAccountError extends DomainError {
  readonly code = 'INVALID_GUEST_ACCOUNT' as const;

  constructor(reason: string) {
    super(`Conta de convidado inválida: ${reason}`);
  }
}
