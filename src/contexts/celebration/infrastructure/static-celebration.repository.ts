import { Celebration, CelebrationId } from '../domain/celebration.aggregate';
import type { CelebrationRepository } from '../domain/celebration.repository';
import { CelebrationSchedule } from '../domain/value-objects/celebration-schedule';
import { DressCode } from '../domain/value-objects/dress-code';
import { GeoCoordinates } from '../domain/value-objects/geo-coordinates';
import { Honoree } from '../domain/value-objects/honoree';
import { Venue } from '../domain/value-objects/venue';
import { celebrationConfig, type CelebrationConfig } from './celebration.config';

/**
 * Driven adapter — builds the `Celebration` aggregate from a config file.
 *
 * The mapping is the interesting part: raw strings and numbers only become
 * domain objects by passing through the Value Object factories, so an invalid
 * config cannot produce a valid aggregate. ADR-0007 explains why a config file
 * beats a database table for data that changes once, before the party.
 */
export class StaticCelebrationRepository implements CelebrationRepository {
  constructor(private readonly config: CelebrationConfig = celebrationConfig) {}

  async current(): Promise<Celebration> {
    const { honoree, schedule, venue, dressCode } = this.config;

    return Celebration.create(CelebrationId.fromString('ivy-2-anos'), {
      honoree: Honoree.create(honoree.name, honoree.turningAge),
      dressCode: DressCode.create({
        headline: dressCode.headline,
        guidance: dressCode.guidance,
        palette: dressCode.palette.map((color) => ({ name: color.name, hex: color.hex })),
      }),
      schedule: CelebrationSchedule.create({
        startsAt: new Date(schedule.startsAt),
        endsAt: new Date(schedule.endsAt),
        timeZone: schedule.timeZone,
      }),
      venue: Venue.create({
        name: venue.name,
        streetAddress: venue.streetAddress,
        locality: venue.locality,
        coordinates: GeoCoordinates.create(venue.latitude, venue.longitude),
      }),
    });
  }
}
