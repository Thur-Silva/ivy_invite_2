import type { NavigationLinkProvider } from '../../application/ports/navigation-link-provider';
import type { Venue } from '../../domain/value-objects/venue';

/**
 * Anti-Corruption Layer around Google Maps and Waze.
 *
 * Uses the **keyless** endpoints on purpose (see ADR-0006): `output=embed` for
 * the inline preview and the documented `dir/?api=1` deep link for navigation.
 * No API key to leak, no billing account to babysit, no JS SDK on the critical
 * path of a mobile page.
 *
 * The embed is searched by name + address rather than by coordinates so the
 * pin shows the venue's own label instead of a bare dot.
 */
export class GoogleMapsLinkProvider implements NavigationLinkProvider {
  embedUrl(venue: Venue): string {
    const query = encodeURIComponent(`${venue.name}, ${venue.fullAddress()}`);
    return `https://www.google.com/maps?q=${query}&z=16&output=embed`;
  }

  directionsUrl(venue: Venue): string {
    // Coordinates, not the address: the route must end at the gate, not at
    // whatever Google's geocoder guesses from a text search.
    const destination = encodeURIComponent(venue.coordinates.toPair());
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
  }

  wazeUrl(venue: Venue): string {
    return `https://waze.com/ul?ll=${venue.coordinates.toPair()}&navigate=yes`;
  }
}
