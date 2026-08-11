import { AggregateRoot } from '@/shared/kernel/aggregate-root';
import { Identifier } from '@/shared/kernel/identifier';
import type { CelebrationSchedule } from './value-objects/celebration-schedule';
import type { Honoree } from './value-objects/honoree';
import type { Venue } from './value-objects/venue';

export class CelebrationId extends Identifier {
  private constructor(value: string) {
    super({ value });
  }

  static fromString(value: string): CelebrationId {
    return new CelebrationId(value);
  }
}

interface CelebrationProps {
  honoree: Honoree;
  schedule: CelebrationSchedule;
  venue: Venue;
}

/**
 * Aggregate Root — the party itself.
 *
 * This Bounded Context is a **supporting subdomain**: within Sprint 1 the
 * celebration is authored by the hosts in a config file and is read-only at
 * runtime, so the aggregate exposes no behaviour beyond guarding its own
 * consistency. It exists as a proper aggregate (rather than a loose object)
 * because the invitation, calendar links and map all depend on these facts
 * being valid, and because a future "hosts edit the party details" story lands
 * here without a rewrite.
 */
export class Celebration extends AggregateRoot<CelebrationId> {
  private constructor(
    id: CelebrationId,
    private readonly props: CelebrationProps,
  ) {
    super(id);
  }

  static create(id: CelebrationId, props: CelebrationProps): Celebration {
    return new Celebration(id, props);
  }

  get honoree(): Honoree {
    return this.props.honoree;
  }

  get schedule(): CelebrationSchedule {
    return this.props.schedule;
  }

  get venue(): Venue {
    return this.props.venue;
  }
}
