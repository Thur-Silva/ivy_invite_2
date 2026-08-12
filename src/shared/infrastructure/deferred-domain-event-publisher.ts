import { after } from 'next/server';
import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { DomainEvent } from '@/shared/kernel/domain-event';

/**
 * Adapter. Adia a publicação para depois da resposta ao convidado.
 *
 * ## O problema que resolve
 *
 * `SubmitRsvp` dá `await` no `publish`. Sem adiar, o convidado que toca "Enviar"
 * fica olhando o botão em "Enviando…" enquanto uma requisição HTTP sai para o
 * serviço de e-mail, possivelmente com retentativa e backoff. No pior caso são
 * segundos de espera por um trabalho que ele não pediu e não vê.
 *
 * `after()` do Next executa a tarefa **depois** de a resposta ser enviada, ainda
 * dentro da mesma invocação serverless. O RSVP responde na hora e o e-mail sai em
 * seguida.
 *
 * ## Por que é um decorador e não um `after()` solto no caso de uso
 *
 * Assim o `next/server` fica confinado a um arquivo de infraestrutura. O caso de
 * uso continua sem saber que existe framework, e os assinantes de verdade
 * (`EmailNotifyingEventPublisher`, `ConsoleDomainEventPublisher`) continuam
 * testáveis sem simular o ciclo de vida de requisição do Next.
 *
 * ## O que isto NÃO garante
 *
 * `after()` roda dentro da invocação. Se a função serverless for encerrada antes
 * de a tarefa terminar, o e-mail se perde. É o motivo de o teto por tentativa no
 * adapter HTTP ser curto: melhor falhar rápido e deixar rastro no log do que
 * estourar o tempo da função no meio de um backoff.
 */
export class DeferredDomainEventPublisher implements DomainEventPublisher {
  constructor(private readonly inner: DomainEventPublisher) {}

  async publish(events: readonly DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    after(async () => {
      try {
        await this.inner.publish(events);
      } catch (error) {
        // `after` não tem quem trate a rejeição. Engolir aqui, com log, é o que
        // impede uma promessa rejeitada de derrubar a invocação inteira.
        console.error('[events] publicação adiada falhou', error);
      }
    });
  }
}
