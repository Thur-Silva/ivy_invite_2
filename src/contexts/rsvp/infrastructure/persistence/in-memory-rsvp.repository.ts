import type { Rsvp } from '../../domain/rsvp.aggregate';
import type { RsvpRepository } from '../../domain/rsvp.repository';
import type { GuestKey } from '../../domain/value-objects/guest-key';

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

  async save(rsvp: Rsvp): Promise<void> {
    this.byGuestKey.set(rsvp.guestKey.value, rsvp);
  }

  /** Test helper — inspect what was stored. Not part of the port. */
  snapshot(): readonly Rsvp[] {
    return [...this.byGuestKey.values()];
  }
}
