import 'server-only';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { Rsvp } from '../../domain/rsvp.aggregate';
import type { RsvpRepository } from '../../domain/rsvp.repository';
import type { GuestKey } from '../../domain/value-objects/guest-key';
import { rsvpsTable } from './drizzle/rsvp.schema';
import { RsvpMapper } from './rsvp.mapper';

/**
 * Driven adapter — `RsvpRepository` backed by Neon serverless Postgres.
 *
 * Uses the HTTP driver (`neon-http`): one round trip per statement, no
 * connection pool to exhaust, which is the right fit for Vercel functions that
 * handle a handful of RSVPs. See ADR-0003.
 */
export class NeonRsvpRepository implements RsvpRepository {
  private readonly db: NeonHttpDatabase<Record<string, never>>;

  constructor(connectionString: string) {
    this.db = drizzle(neon(connectionString));
  }

  async findByGuestKey(guestKey: GuestKey): Promise<Rsvp | null> {
    const rows = await this.db
      .select()
      .from(rsvpsTable)
      .where(eq(rsvpsTable.guestKey, guestKey.value))
      .limit(1);

    const row = rows.at(0);
    return row === undefined ? null : RsvpMapper.toDomain(row);
  }

  /**
   * Single atomic upsert keyed by `guest_key`.
   *
   * `id` and `responded_at` are intentionally left out of the `set` clause: the
   * aggregate's identity and the moment the guest first answered never change,
   * even when they change their mind.
   */
  async save(rsvp: Rsvp): Promise<void> {
    const row = RsvpMapper.toRow(rsvp);

    await this.db
      .insert(rsvpsTable)
      .values(row)
      .onConflictDoUpdate({
        target: rsvpsTable.guestKey,
        set: {
          guestName: row.guestName,
          decision: row.decision,
          updatedAt: row.updatedAt,
        },
      });
  }
}
