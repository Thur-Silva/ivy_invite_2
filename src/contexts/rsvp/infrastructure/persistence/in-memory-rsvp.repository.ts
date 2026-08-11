import type { Rsvp } from '../../domain/rsvp.aggregate';
import type { RsvpRepository } from '../../domain/rsvp.repository';
import type { GuestKey } from '../../domain/value-objects/guest-key';
import type { RespondentIdentity } from '../../domain/value-objects/respondent-identity';

/**
 * Driven adapter — in-memory `RsvpRepository`.
 *
 * Two uses, both first-class:
 *  - unit tests of the Use Case run with zero infrastructure;
 *  - `npm run dev` works before anyone has provisioned a Neon database.
 *
 * Not durable: a serverless instance recycles and the guest list is gone. The
 * composition root therefore refuses it in production.
 */
export class InMemoryRsvpRepository implements RsvpRepository {
  private readonly byGuestKey = new Map<string, Rsvp>();

  async findByGuestKey(guestKey: GuestKey): Promise<Rsvp | null> {
    return this.byGuestKey.get(guestKey.value) ?? null;
  }

  /**
   * Varredura linear usando a **regra canônica do domínio**, em vez de um
   * segundo índice. São dezenas de respostas, e delegar a comparação ao Value
   * Object garante que este dublê nunca divirja da regra que ele existe para
   * exercitar nos testes.
   */
  async findByRespondent(identity: RespondentIdentity): Promise<Rsvp | null> {
    for (const rsvp of this.byGuestKey.values()) {
      if (rsvp.identity.isSameRespondentAs(identity)) return rsvp;
    }
    return null;
  }

  async save(rsvp: Rsvp): Promise<void> {
    this.byGuestKey.set(rsvp.guestKey.value, rsvp);
  }

  /** Test helper — inspect what was stored. Not part of the port. */
  snapshot(): readonly Rsvp[] {
    return [...this.byGuestKey.values()];
  }
}
