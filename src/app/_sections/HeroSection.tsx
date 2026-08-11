import type { CelebrationView } from '@/contexts/celebration/application/dto/celebration.view';
import { HeroTitle } from '@/ui/HeroTitle';
import { Reveal } from '@/ui/Reveal';
import { CrownIcon } from '@/ui/ornaments/CrownIcon';
import { RippleRings } from '@/ui/ornaments/RippleRings';
import { invitationCopy } from '../_content/invitation-copy';

/**
 * Primeira dobra: quem, o quê e a promessa de um conto de fadas.
 *
 * `100svh` (small viewport height) em vez de `100vh` para o herói nunca ser
 * cortado pela barra retrátil do Safari mobile.
 *
 * A composição tem três planos: os anéis de água se abrindo ao fundo, a coroa
 * flutuando com o reflexo atravessando o ouro, e o nome entrando letra por letra.
 */
export function HeroSection({ celebration }: { celebration: CelebrationView }) {
  const { honoree } = celebration;

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 py-20 text-center">
      <Reveal className="relative mb-6 w-24 sm:w-28">
        <RippleRings />
        <div className="animate-float relative">
          <CrownIcon />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="font-script text-blush-300 text-2xl sm:text-3xl">
          {invitationCopy.hero.eyebrow}
        </p>
      </Reveal>

      <HeroTitle name={honoree.name} turningAge={honoree.turningAge} />

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
