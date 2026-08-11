import { Rsvp } from '../../domain/rsvp.aggregate';
import { AttendanceDecision } from '../../domain/value-objects/attendance-decision';
import { GuestName } from '../../domain/value-objects/guest-name';
import { RsvpId } from '../../domain/value-objects/rsvp-id';
import type { NewRsvpRow, RsvpRow } from './drizzle/rsvp.schema';

/**
 * Translates between the aggregate and its table row.
 *
 * This mapper is what keeps the Domain layer free of Drizzle: no decorators, no
 * base classes, no ORM types anywhere inside `domain/`. Swapping Neon for
 * anything else means rewriting this file and the repository — nothing else.
 */
export const RsvpMapper = {
  toDomain(row: RsvpRow): Rsvp {
    return Rsvp.rehydrate({
      id: RsvpId.fromString(row.id),
      guestName: GuestName.create(row.guestName),
      decision: AttendanceDecision.fromValue(row.decision),
      respondedAt: row.respondedAt,
      updatedAt: row.updatedAt,
    });
  },

  toRow(rsvp: Rsvp): NewRsvpRow {
    return {
      id: rsvp.id.value,
      guestKey: rsvp.guestKey.value,
      guestName: rsvp.guestName.value,
      decision: rsvp.decision.value,
      respondedAt: rsvp.respondedAt,
      updatedAt: rsvp.updatedAt,
    };
  },
};
