/**
 * Port — the passage of time.
 *
 * Injected instead of calling `new Date()` inside the domain so that
 * "responded at" is deterministic in tests and can be frozen in fixtures.
 */
export interface Clock {
  now(): Date;
}
