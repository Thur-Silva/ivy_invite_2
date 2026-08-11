import type { Rsvp } from './rsvp.aggregate';
import type { GuestKey } from './value-objects/guest-key';

/**
 * Port (driven side of the hexagon) — the collection of `Rsvp` aggregates as
 * the domain wishes it existed.
 *
 * It is declared in the Domain layer because "the set of answers to the
 * invitation" is a domain concept; the fact that it happens to live in Neon
 * Postgres is an Infrastructure detail (see `NeonRsvpRepository`).
 *
 * Kept intentionally minimal: Sprint 1 only needs to recognise a returning
 * guest and to store an answer. Query methods for the host dashboard arrive
 * with PBI-05, not before (YAGNI).
 */
export interface RsvpRepository {
  findByGuestKey(guestKey: GuestKey): Promise<Rsvp | null>;

  /** Creates or updates the aggregate as a whole. Must be atomic per guest. */
  save(rsvp: Rsvp): Promise<void>;
}
