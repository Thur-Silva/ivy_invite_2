/**
 * Shared Kernel. Value Object base class.
 *
 * A Value Object has no identity: two instances holding the same attributes
 * are interchangeable. They are immutable by construction (`Object.freeze`)
 * and must be created through a static factory that enforces the invariant,
 * so an invalid Value Object cannot exist in memory.
 */
export abstract class ValueObject<Props extends object> {
  protected readonly props: Readonly<Props>;

  protected constructor(props: Props) {
    this.props = Object.freeze({ ...props });
  }

  /** Structural equality. Same class + same attributes = same value. */
  equals(other?: ValueObject<Props> | null): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
