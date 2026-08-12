import type { Rsvp } from '../../domain/rsvp.aggregate';
import type { RsvpRepository } from '../../domain/rsvp.repository';
import type { GuestAccount } from '../../domain/value-objects/guest-account';
import type { GuestKey } from '../../domain/value-objects/guest-key';
import type { RespondentIdentity } from '../../domain/value-objects/respondent-identity';

/**
 * Driven adapter. `RsvpRepository` em memória.
 *
 * Dois usos, os dois de primeira classe:
 *  - testes de unidade do caso de uso rodam sem nenhuma infraestrutura;
 *  - `npm run dev` funciona antes de alguém provisionar um banco no Neon.
 *
 * **Indexado pelo id do agregado**, e não pela chave do nome. Já foi pelo nome, e
 * isso escondia um bug: quando a pessoa corrigia o nome que veio preenchido, a
 * resposta era gravada sob a chave nova e a antiga ficava para trás, virando
 * duas. Id é a única identidade que não muda.
 *
 * Não é durável: a instância recicla e a lista some. O composition root recusa
 * este adapter em produção.
 */
export class InMemoryRsvpRepository implements RsvpRepository {
  private readonly byId = new Map<string, Rsvp>();

  async findByAccount(account: GuestAccount): Promise<Rsvp | null> {
    for (const rsvp of this.byId.values()) {
      if (rsvp.account.provider === account.provider && rsvp.account.subject === account.subject) {
        return rsvp;
      }
    }
    return null;
  }

  async findByGuestKey(guestKey: GuestKey): Promise<Rsvp | null> {
    for (const rsvp of this.byId.values()) {
      if (rsvp.guestKey.equals(guestKey)) return rsvp;
    }
    return null;
  }

  /**
   * Varredura linear usando a **regra canônica do domínio**. São dezenas de
   * respostas, e delegar a comparação ao Value Object garante que este dublê
   * nunca divirja da regra que ele existe para exercitar nos testes.
   */
  async findByRespondent(identity: RespondentIdentity): Promise<Rsvp | null> {
    for (const rsvp of this.byId.values()) {
      if (rsvp.identity.isSameRespondentAs(identity)) return rsvp;
    }
    return null;
  }

  async save(rsvp: Rsvp): Promise<void> {
    this.byId.set(rsvp.id.value, rsvp);
  }

  /** Test helper. Inspeciona o que foi gravado. Não faz parte da porta. */
  snapshot(): readonly Rsvp[] {
    return [...this.byId.values()];
  }
}
