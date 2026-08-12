import { ValueObject } from '@/shared/kernel/value-object';
import { InvalidCelebrationDetailsError } from '../errors/invalid-celebration-details.error';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export interface PaletteColor {
  /** Nome que o convidado lê, ex.: "Verde musgo". */
  readonly name: string;
  /** Hex exibido na amostra de cor, ex.: "#4F6F52". */
  readonly hex: string;
}

interface DressCodeProps {
  headline: string;
  guidance: string;
  palette: readonly PaletteColor[];
}

/**
 * O que os convidados devem vestir.
 *
 * É fato da festa, definido pelos anfitriões, e por isso mora no domínio junto
 * com local e horário. Não na cópia da página. A paleta é validada: cor sem
 * nome ou com hex malformado quebra o boot em vez de renderizar uma amostra
 * cinza no convite.
 */
export class DressCode extends ValueObject<DressCodeProps> {
  private constructor(props: DressCodeProps) {
    super(props);
  }

  static create(props: DressCodeProps): DressCode {
    if (props.headline.trim().length === 0) {
      throw new InvalidCelebrationDetailsError('O traje precisa de um título.');
    }
    if (props.palette.length === 0) {
      throw new InvalidCelebrationDetailsError('A paleta do traje precisa de ao menos uma cor.');
    }
    for (const color of props.palette) {
      if (color.name.trim().length === 0) {
        throw new InvalidCelebrationDetailsError('Toda cor da paleta precisa de um nome.');
      }
      if (!HEX_COLOR.test(color.hex)) {
        throw new InvalidCelebrationDetailsError(
          `Cor "${color.name}" tem hex inválido: ${color.hex}. Use o formato #RRGGBB.`,
        );
      }
    }

    return new DressCode({
      headline: props.headline.trim(),
      guidance: props.guidance.trim(),
      palette: [...props.palette],
    });
  }

  get headline(): string {
    return this.props.headline;
  }

  get guidance(): string {
    return this.props.guidance;
  }

  get palette(): readonly PaletteColor[] {
    return this.props.palette;
  }
}
