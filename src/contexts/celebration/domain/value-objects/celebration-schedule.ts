import { ValueObject } from '@/shared/kernel/value-object';
import { InvalidCelebrationDetailsError } from '../errors/invalid-celebration-details.error';

interface CelebrationScheduleProps {
  startsAt: Date;
  endsAt: Date;
  /** IANA time zone, e.g. `America/Sao_Paulo`. */
  timeZone: string;
}

/**
 * When the party happens.
 *
 * Stored as instants plus an explicit IANA time zone so the invitation always
 * shows the party's local time, no matter where the guest's phone thinks it is.
 */
export class CelebrationSchedule extends ValueObject<CelebrationScheduleProps> {
  private constructor(props: CelebrationScheduleProps) {
    super(props);
  }

  static create(props: CelebrationScheduleProps): CelebrationSchedule {
    if (Number.isNaN(props.startsAt.getTime()) || Number.isNaN(props.endsAt.getTime())) {
      throw new InvalidCelebrationDetailsError('Data da festa inválida.');
    }
    if (props.endsAt.getTime() <= props.startsAt.getTime()) {
      throw new InvalidCelebrationDetailsError('A festa não pode terminar antes de começar.');
    }
    return new CelebrationSchedule(props);
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }

  get timeZone(): string {
    return this.props.timeZone;
  }
}
