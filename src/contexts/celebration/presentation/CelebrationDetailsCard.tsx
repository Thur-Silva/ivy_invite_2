import { Flourish } from '@/ui/ornaments/Flourish';
import type { CelebrationView } from '../application/dto/celebration.view';
import { buildCelebrationLabels } from './celebration-format';

/** Date and time of the party, as a card the guest can screenshot. */
export function CelebrationDetailsCard({ celebration }: { celebration: CelebrationView }) {
  const labels = buildCelebrationLabels(celebration);

  return (
    <div className="surface-pad flex flex-col items-center gap-3 rounded-3xl px-6 py-7 text-center">
      <p className="font-script text-blush-300 text-lg">{labels.weekday}</p>

      {/*
        `items-center`, e não `items-baseline`.

        A linha de base de um container flex vem do primeiro item dele, então
        alinhar pela base fazia o mês encostar no pé do "13" e jogava o ano para
        baixo do número, desequilibrando o par. Pior: com `leading-none` no
        número gigante, o resultado variava entre navegadores. Centralizar os
        dois blocos é previsível e é o que se espera de um card de data.
      */}
      <time
        dateTime={labels.machineDate}
        className="font-display flex items-center justify-center gap-3"
      >
        <span className="text-foil text-5xl leading-none">{labels.day}</span>
        <span className="flex flex-col items-start gap-0.5 text-left">
          <span className="text-gold-400 text-xl leading-none">{labels.month}</span>
          {/*
            A compensação vale mesmo com o texto alinhado à esquerda: a sobra da
            última letra engorda a coluna, e como o `<time>` inteiro é
            centralizado no cartão, essa largura a mais empurra o conjunto para
            a esquerda.
          */}
          <span className="text-cream/55 -me-[0.25em] text-xs leading-none tracking-[0.25em]">
            {labels.year}
          </span>
        </span>
      </time>

      <Flourish className="my-1" />

      <p className="text-cream/80 text-sm tracking-wide">{labels.timeRange}</p>
      <p className="text-cream/50 text-xs">Horário de Brasília</p>
    </div>
  );
}
