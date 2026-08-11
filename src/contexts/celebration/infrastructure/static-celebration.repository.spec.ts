import { describe, expect, it } from 'vitest';
import { GetCelebrationDetails } from '../application/use-cases/get-celebration-details.use-case';
import { GoogleMapsLinkProvider } from './maps/google-maps-link-provider';
import { StaticCelebrationRepository } from './static-celebration.repository';

/**
 * Safety net for the hosts.
 *
 * `celebration.config.ts` is the one file a non-developer is expected to edit.
 * These tests fail fast on a swapped latitude, an inverted date range or a
 * blank address, before a wrong invitation reaches a single guest.
 */
describe('celebration configuration', () => {
  it('produces a valid Celebration aggregate from the config file', async () => {
    const celebration = await new StaticCelebrationRepository().current();

    expect(celebration.honoree.name).toBe('Ivy');
    expect(celebration.honoree.turningAge).toBe(2);
    expect(celebration.schedule.endsAt.getTime()).toBeGreaterThan(
      celebration.schedule.startsAt.getTime(),
    );
    expect(celebration.venue.fullAddress().length).toBeGreaterThan(10);
  });

  it('places the venue in Brazil — a swapped latitude/longitude is a typo', async () => {
    const { venue } = await new StaticCelebrationRepository().current();

    expect(venue.coordinates.latitude).toBeGreaterThan(-34);
    expect(venue.coordinates.latitude).toBeLessThan(6);
    expect(venue.coordinates.longitude).toBeGreaterThan(-74);
    expect(venue.coordinates.longitude).toBeLessThan(-34);
  });

  it('exposes a read model with working navigation links', async () => {
    const view = await new GetCelebrationDetails({
      celebrations: new StaticCelebrationRepository(),
      navigation: new GoogleMapsLinkProvider(),
    }).execute();

    expect(view.navigation.embedUrl).toContain('output=embed');
    expect(view.navigation.directionsUrl).toContain('api=1');
    expect(view.navigation.directionsUrl).toContain(
      encodeURIComponent(`${view.venue.latitude},${view.venue.longitude}`),
    );
    expect(view.navigation.wazeUrl).toContain('navigate=yes');
    // The read model must be serializable across the RSC boundary.
    expect(() => JSON.stringify(view)).not.toThrow();
  });
});
