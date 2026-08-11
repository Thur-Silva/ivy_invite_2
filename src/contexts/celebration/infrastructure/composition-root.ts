import { GetCelebrationDetails } from '../application/use-cases/get-celebration-details.use-case';
import { GoogleMapsLinkProvider } from './maps/google-maps-link-provider';
import { StaticCelebrationRepository } from './static-celebration.repository';

/**
 * Composition Root of the Celebration Bounded Context.
 *
 * No `server-only` guard here: the celebration is public information with no
 * secrets, so a Client Component may legitimately compose this Use Case too.
 */
export function makeGetCelebrationDetails(): GetCelebrationDetails {
  return new GetCelebrationDetails({
    celebrations: new StaticCelebrationRepository(),
    navigation: new GoogleMapsLinkProvider(),
  });
}
