import type { Result } from '@/shared/kernel/result';

/** Uma mensagem pronta para sair. Corpo já renderizado. */
export interface EmailMessage {
  readonly to: readonly string[];
  readonly subject: string;
  readonly html: string;
  /** Parte texto puro. Se ausente, o serviço deriva do HTML. */
  readonly text?: string;
  readonly replyTo?: string;
  /**
   * Chave de idempotência, derivada do **evento de negócio**, nunca da
   * tentativa.
   *
   * `rsvp-<id>-confirmado-anfitriao` deduplica; um UUID novo a cada retry não
   * deduplica nada. É o que garante que um timeout de rede seguido de retry não
   * mande dois e-mails para o mesmo convidado.
   */
  readonly idempotencyKey: string;
  /** Amarra o log do serviço de e-mail ao nosso rastro. Opcional. */
  readonly correlationId?: string;
}

/** Comprovante de **aceite**, não de entrega. */
export interface EmailReceipt {
  /** Guardar junto do registro de negócio: liga um e-mail recebido ao envio. */
  readonly messageId: string;
  /** Chave de busca no log de quem opera o serviço. Citar em suporte. */
  readonly requestId: string;
  /** `true` = veio do cache de idempotência, nenhum e-mail novo saiu. */
  readonly replayed: boolean;
  readonly accepted: readonly string[];
  readonly rejected: readonly string[];
}

export type EmailFailure = {
  /**
   * `PERMANENT` = como está, não é entregável. Retentar só queima cota.
   * `TRANSIENT` = rede ou throttling. Retentar faz sentido.
   *
   * A distinção existe porque o serviço devolve o mesmo `DISPATCH_FAILED` em
   * `422` (permanente) e `502` (transiente), e tratar os dois igual é o erro
   * que mais custa tempo nessa integração.
   */
  readonly kind: 'PERMANENT' | 'TRANSIENT';
  readonly code: string;
  readonly message: string;
  readonly requestId?: string;
};

/**
 * Port. Enviar um e-mail.
 *
 * Subdomínio genérico: existe um serviço hospedado que faz isso, e o convite o
 * consome. A porta existe para que nenhuma camada acima da infraestrutura saiba
 * que há HTTP, header de autorização ou política de retentativa no caminho.
 *
 * Nunca lança. Falhar em notificar não pode derrubar um RSVP já gravado, então o
 * resultado vem como dado e quem chama é obrigado pelo tipo a decidir o que
 * fazer com a falha.
 */
export interface EmailSender {
  send(message: EmailMessage): Promise<Result<EmailReceipt, EmailFailure>>;
}
