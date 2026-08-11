import type { CelebrationView } from '@/contexts/celebration/application/dto/celebration.view';
import { Reveal } from '@/ui/Reveal';
import { CrownIcon } from '@/ui/ornaments/CrownIcon';
import { invitationCopy } from '../_content/invitation-copy';

/**
 * Above the fold: who, what and the promise of a fairy tale.
 *
 * `100svh` (small viewport height) instead of `100vh` so the hero is never cut
 * off by mobile Safari's collapsing toolbar. The honoree's name is a real `h1`
 * for screen readers, with the decorative split into two lines marked
 * `aria-hidden` so it is announced once, cleanly.
 */
export function HeroSection({ celebration }: { celebration: CelebrationView }) {
  const { honoree } = celebration;

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 py-20 text-center">
      <Reveal className="mb-6 w-24 sm:w-28">
        <div className="animate-float">
          <CrownIcon />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="font-script text-blush-300 text-2xl sm:text-3xl">
          {invitationCopy.hero.eyebrow}
        </p>
      </Reveal>

      <Reveal delay={0.2}>
        <h1 className="mt-2">
          <span className="sr-only">
            {honoree.name} faz {honoree.turningAge} anos
          </span>
          <span
            aria-hidden="true"
            className="text-foil font-display block text-[clamp(4rem,26vw,7rem)] leading-[0.95] font-bold"
          >
            {honoree.name}
          </span>
          <span
            aria-hidden="true"
            className="font-display text-cream/80 mt-1 block text-lg tracking-[0.3em] uppercase sm:text-xl"
          >
            faz {honoree.turningAge} anos
          </span>
        </h1>
      </Reveal>

      <Reveal delay={0.35}>
        <p className="border-gold-500/30 bg-pond-900/50 text-gold-400 mt-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs tracking-[0.18em] uppercase backdrop-blur-sm">
          {invitationCopy.hero.theme}
        </p>
      </Reveal>

      <Reveal delay={0.5} className="absolute bottom-8 left-0 flex w-full justify-center">
        <span className="text-cream/45 flex flex-col items-center gap-2 text-[0.65rem] tracking-[0.2em] uppercase">
          {invitationCopy.hero.scrollCue}
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="stroke-gold-500 h-4 w-4 animate-bounce fill-none stroke-2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Reveal>
    </section>
  );
}
