import type { CelebrationView } from '../application/dto/celebration.view';

export interface CelebrationLabels {
  readonly weekday: string;
  readonly day: string;
  readonly month: string;
  readonly year: string;
  readonly timeRange: string;
  readonly machineDate: string;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Formats the schedule for display.
 *
 * Every part is derived from the instant plus the party's IANA time zone, so
 * the weekday can never contradict the date and a guest travelling abroad still
 * reads São Paulo time. Called from Server Components, which keeps the output
 * identical between SSR and hydration.
 */
export function buildCelebrationLabels(view: CelebrationView): CelebrationLabels {
  const { startsAtIso, endsAtIso, timeZone } = view.schedule;
  const startsAt = new Date(startsAtIso);
  const endsAt = new Date(endsAtIso);

  const part = (options: Intl.DateTimeFormatOptions, date: Date = startsAt): string =>
    new Intl.DateTimeFormat('pt-BR', { timeZone, ...options }).format(date);

  const startTime = part({ hour: '2-digit', minute: '2-digit' });
  const endTime = part({ hour: '2-digit', minute: '2-digit' }, endsAt);

  return {
    weekday: capitalize(part({ weekday: 'long' })),
    day: part({ day: '2-digit' }),
    month: capitalize(part({ month: 'long' })),
    year: part({ year: 'numeric' }),
    timeRange: `${startTime} às ${endTime}`,
    // Feeds the <time dateTime> attribute. Machine-readable, for real.
    machineDate: startsAtIso,
  };
}
