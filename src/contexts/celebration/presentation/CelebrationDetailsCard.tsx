import { Flourish } from '@/ui/ornaments/Flourish';
import type { CelebrationView } from '../application/dto/celebration.view';
import { buildCelebrationLabels } from './celebration-format';

/** Date and time of the party, as a card the guest can screenshot. */
export function CelebrationDetailsCard({ celebration }: { celebration: CelebrationView }) {
  const labels = buildCelebrationLabels(celebration);

  return (
    <div className="surface-pad flex flex-col items-center gap-3 rounded-3xl px-6 py-7 text-center">
      <p className="font-script text-blush-300 text-lg">{labels.weekday}</p>

      <time
        dateTime={labels.machineDate}
        className="font-display flex items-baseline justify-center gap-2"
      >
        <span className="text-foil text-5xl leading-none">{labels.day}</span>
        <span className="flex flex-col items-start text-left">
          <span className="text-gold-400 text-xl leading-tight">{labels.month}</span>
          <span className="text-cream/55 text-xs tracking-[0.25em]">{labels.year}</span>
        </span>
      </time>

      <Flourish className="my-1" />

      <p className="text-cream/80 text-sm tracking-wide">{labels.timeRange}</p>
      <p className="text-cream/50 text-xs">Horário de Brasília</p>
    </div>
  );
}
