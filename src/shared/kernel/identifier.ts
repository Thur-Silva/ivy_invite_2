import { ValueObject } from './value-object';

/**
 * Shared Kernel — base class for aggregate identities.
 *
 * Identities are Value Objects: opaque, immutable and compared by value.
 * Each Bounded Context declares its own concrete identity type (e.g. `RsvpId`)
 * so a `RsvpId` can never be passed where a `GuestId` is expected.
 */
export abstract class Identifier extends ValueObject<{ value: string }> {
  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
