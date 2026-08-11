import type { Identifier } from './identifier';

/**
 * Shared Kernel — Entity base class.
 *
 * An Entity is defined by its identity, not by its attributes: two entities
 * are the same if their ids match, even when every other field differs.
 */
export abstract class Entity<TId extends Identifier> {
  protected constructor(readonly id: TId) {}

  equals(other?: Entity<TId> | null): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return this.id.equals(other.id);
  }
}
