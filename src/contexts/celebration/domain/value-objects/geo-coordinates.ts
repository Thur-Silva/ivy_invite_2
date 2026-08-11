import { ValueObject } from '@/shared/kernel/value-object';
import { InvalidCelebrationDetailsError } from '../errors/invalid-celebration-details.error';

/** A point on Earth. Used to build map and turn-by-turn navigation links. */
export class GeoCoordinates extends ValueObject<{ latitude: number; longitude: number }> {
  private constructor(latitude: number, longitude: number) {
    super({ latitude, longitude });
  }

  static create(latitude: number, longitude: number): GeoCoordinates {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new InvalidCelebrationDetailsError(`Latitude fora do intervalo válido: ${latitude}.`);
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new InvalidCelebrationDetailsError(`Longitude fora do intervalo válido: ${longitude}.`);
    }
    return new GeoCoordinates(latitude, longitude);
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  /** `lat,lng` — the format every maps provider accepts. */
  toPair(): string {
    return `${this.props.latitude},${this.props.longitude}`;
  }
}
