import { ValueObject } from '@/shared/kernel/value-object';
import { InvalidCelebrationDetailsError } from '../errors/invalid-celebration-details.error';
import type { GeoCoordinates } from './geo-coordinates';

interface VenueProps {
  name: string;
  streetAddress: string;
  locality: string;
  coordinates: GeoCoordinates;
}

/** Where the party happens, in a form maps providers can resolve. */
export class Venue extends ValueObject<VenueProps> {
  private constructor(props: VenueProps) {
    super(props);
  }

  static create(props: VenueProps): Venue {
    if (props.name.trim().length === 0) {
      throw new InvalidCelebrationDetailsError('O local da festa precisa ter um nome.');
    }
    if (props.streetAddress.trim().length === 0) {
      throw new InvalidCelebrationDetailsError('O local da festa precisa ter um endereço.');
    }
    return new Venue(props);
  }

  get name(): string {
    return this.props.name;
  }

  get streetAddress(): string {
    return this.props.streetAddress;
  }

  get locality(): string {
    return this.props.locality;
  }

  get coordinates(): GeoCoordinates {
    return this.props.coordinates;
  }

  /** One-line address for display and for map search queries. */
  fullAddress(): string {
    return `${this.props.streetAddress}, ${this.props.locality}`;
  }
}
