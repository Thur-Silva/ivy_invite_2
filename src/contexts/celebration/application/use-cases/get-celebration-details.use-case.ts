import type { CelebrationRepository } from '../../domain/celebration.repository';
import type { CelebrationView } from '../dto/celebration.view';
import type { NavigationLinkProvider } from '../ports/navigation-link-provider';

/**
 * Use Case (query) — "show me the party details".
 *
 * A query, so it returns a read model instead of a `Result`: there is no
 * business rule to violate and no state to change. Failures here are boot-time
 * configuration errors and are meant to surface loudly.
 */
export class GetCelebrationDetails {
  constructor(
    private readonly deps: {
      readonly celebrations: CelebrationRepository;
      readonly navigation: NavigationLinkProvider;
    },
  ) {}

  async execute(): Promise<CelebrationView> {
    const celebration = await this.deps.celebrations.current();
    const { honoree, schedule, venue, dressCode } = celebration;

    return {
      honoree: {
        name: honoree.name,
        turningAge: honoree.turningAge,
      },
      schedule: {
        startsAtIso: schedule.startsAt.toISOString(),
        endsAtIso: schedule.endsAt.toISOString(),
        timeZone: schedule.timeZone,
      },
      venue: {
        name: venue.name,
        streetAddress: venue.streetAddress,
        locality: venue.locality,
        fullAddress: venue.fullAddress(),
        latitude: venue.coordinates.latitude,
        longitude: venue.coordinates.longitude,
      },
      navigation: {
        embedUrl: this.deps.navigation.embedUrl(venue),
        directionsUrl: this.deps.navigation.directionsUrl(venue),
        wazeUrl: this.deps.navigation.wazeUrl(venue),
      },
      dressCode: {
        headline: dressCode.headline,
        guidance: dressCode.guidance,
        palette: dressCode.palette.map((color) => ({ name: color.name, hex: color.hex })),
      },
    };
  }
}
