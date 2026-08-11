import type { Venue } from '../../domain/value-objects/venue';

/**
 * Port — how a guest gets from "I read the invitation" to "I am at the party".
 *
 * Abstracted because the map provider is a replaceable third party: the domain
 * knows an address and a coordinate pair, not that Google exists. The adapter
 * that fulfils this port is the Anti-Corruption Layer around the maps vendor.
 */
export interface NavigationLinkProvider {
  /** Src for an inline, cookie-light map preview. */
  embedUrl(venue: Venue): string;
  /** Deep link that opens turn-by-turn navigation in the default maps app. */
  directionsUrl(venue: Venue): string;
  /** Secondary app most Brazilian drivers actually use. */
  wazeUrl(venue: Venue): string;
}
