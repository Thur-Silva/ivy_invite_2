/**
 * Read model handed to the Presentation layer.
 *
 * Plain, serializable data only — it crosses the React Server/Client boundary,
 * so no class instances, no `Date` objects with behaviour attached, no domain
 * types. Dates travel as ISO strings and are formatted for display by the
 * Presentation layer using the party's own time zone.
 */
export interface CelebrationView {
  readonly honoree: {
    readonly name: string;
    readonly turningAge: number;
  };
  readonly schedule: {
    readonly startsAtIso: string;
    readonly endsAtIso: string;
    readonly timeZone: string;
  };
  readonly venue: {
    readonly name: string;
    readonly streetAddress: string;
    readonly locality: string;
    readonly fullAddress: string;
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly navigation: {
    readonly embedUrl: string;
    readonly directionsUrl: string;
    readonly wazeUrl: string;
  };
}
