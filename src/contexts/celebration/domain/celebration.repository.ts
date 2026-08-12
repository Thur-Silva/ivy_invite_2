import type { Celebration } from './celebration.aggregate';

/**
 * Port. Where the party's details come from.
 *
 * Backed by a config file today (`StaticCelebrationRepository`); the port exists
 * so that swapping it for a CMS or an admin screen is an Infrastructure change
 * and the Presentation layer never notices.
 */
export interface CelebrationRepository {
  /** The single celebration this site invites people to. */
  current(): Promise<Celebration>;
}
