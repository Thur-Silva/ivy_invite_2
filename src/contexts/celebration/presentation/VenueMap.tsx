import { MapPinGlyph, NavigationGlyph } from '@/ui/ornaments/Glyphs';
import type { CelebrationView } from '../application/dto/celebration.view';

/**
 * Location block: address, an inline map preview and two navigation deep links.
 *
 * The `<iframe>` is `loading="lazy"` so the map costs nothing until the guest
 * scrolls near it — it sits at the bottom of the page, well below the RSVP form
 * that actually matters. The buttons are what most guests tap; the embed exists
 * to make the place feel real.
 */
export function VenueMap({ celebration }: { celebration: CelebrationView }) {
  const { venue, navigation } = celebration;

  return (
    <div className="flex flex-col gap-5">
      <div className="surface-pad flex flex-col gap-1.5 rounded-3xl px-6 py-6 text-center">
        <p className="font-display text-gold-400 text-xl">{venue.name}</p>
        <p className="text-cream/80 text-sm leading-relaxed">{venue.streetAddress}</p>
        <p className="text-cream/60 text-sm">{venue.locality}</p>
      </div>

      <div className="border-gold-500/25 overflow-hidden rounded-3xl border shadow-[0_18px_50px_-24px_rgba(0,0,0,0.8)]">
        <iframe
          src={navigation.embedUrl}
          title={`Mapa do local da festa: ${venue.name}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="block h-[240px] w-full border-0 sm:h-[300px]"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={navigation.directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="border-gold-500/45 bg-gold-500/10 text-gold-400 group flex min-h-[52px] items-center justify-center gap-2 rounded-full border px-5 py-3.5 text-sm font-semibold transition active:scale-[0.98]"
        >
          <MapPinGlyph className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-active:-translate-y-1" />
          Abrir no Google Maps
        </a>
        <a
          href={navigation.wazeUrl}
          target="_blank"
          rel="noreferrer"
          className="border-lily-400/40 bg-lily-400/10 text-lily-300 group flex min-h-[52px] items-center justify-center gap-2 rounded-full border px-5 py-3.5 text-sm font-semibold transition active:scale-[0.98]"
        >
          <NavigationGlyph className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-active:translate-x-1" />
          Abrir no Waze
        </a>
      </div>
    </div>
  );
}
