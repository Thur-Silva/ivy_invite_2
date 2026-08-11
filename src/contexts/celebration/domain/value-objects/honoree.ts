import { ValueObject } from '@/shared/kernel/value-object';
import { InvalidCelebrationDetailsError } from '../errors/invalid-celebration-details.error';

/** Whose birthday it is, and which birthday. */
export class Honoree extends ValueObject<{ name: string; turningAge: number }> {
  private constructor(name: string, turningAge: number) {
    super({ name, turningAge });
  }

  static create(name: string, turningAge: number): Honoree {
    if (name.trim().length === 0) {
      throw new InvalidCelebrationDetailsError('A aniversariante precisa de um nome.');
    }
    if (!Number.isInteger(turningAge) || turningAge < 1) {
      throw new InvalidCelebrationDetailsError(
        `Idade comemorada inválida: ${turningAge}. Precisa ser um inteiro a partir de 1.`,
      );
    }
    return new Honoree(name.trim(), turningAge);
  }

  get name(): string {
    return this.props.name;
  }

  get turningAge(): number {
    return this.props.turningAge;
  }
}
