import { Rsvp } from '../../domain/rsvp.aggregate';
import { AttendanceDecision } from '../../domain/value-objects/attendance-decision';
import { GuestAccount } from '../../domain/value-objects/guest-account';
import { RespondentIdentity } from '../../domain/value-objects/respondent-identity';
import { GuestName } from '../../domain/value-objects/guest-name';
import { RsvpId } from '../../domain/value-objects/rsvp-id';
import type { NewRsvpRow, RsvpRow } from './drizzle/rsvp.schema';

/**
 * Translates between the aggregate and its table row.
 *
 * This mapper is what keeps the Domain layer free of Drizzle: no decorators, no
 * base classes, no ORM types anywhere inside `domain/`. Swapping Neon for
 * anything else means rewriting this file and the repository. Nothing else.
 */
export const RsvpMapper = {
  toDomain(row: RsvpRow): Rsvp {
    return Rsvp.rehydrate({
      id: RsvpId.fromString(row.id),
      guestName: GuestName.create(row.guestName),
      decision: AttendanceDecision.fromValue(row.decision),
      account: GuestAccount.create({
        provider: row.accountProvider,
        subject: row.accountSubject,
        email: row.accountEmail,
        displayName: row.accountName,
      }),
      identity: RespondentIdentity.fromDigests({
        token: row.respondentToken,
        device: row.respondentDevice,
        network: row.respondentNetwork,
      }),
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
      accountProvider: rsvp.account.provider,
      accountSubject: rsvp.account.subject,
      accountEmail: rsvp.account.email,
      accountName: rsvp.account.displayName,
      respondentToken: rsvp.identity.token,
      respondentDevice: rsvp.identity.device,
      respondentNetwork: rsvp.identity.network,
      respondedAt: rsvp.respondedAt,
      updatedAt: rsvp.updatedAt,
    };
  },
};
