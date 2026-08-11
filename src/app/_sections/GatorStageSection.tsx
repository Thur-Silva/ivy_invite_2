'use client';

import { motion, useMotionValue, useTransform } from 'motion/react';
import { useGatorStage } from '@/graphics/scroll-journey/gator-stage';
import { GATOR_MOUTH_OFFSET, TrumpetGator } from '@/graphics/scroll-journey/TrumpetGator';
import { usePrefersReducedMotion } from '@/ui/hooks/use-environment';
import { invitationCopy } from '../_content/invitation-copy';

/**
 * O palco do jacaré — uma seção de verdade, no fluxo do documento.
 *
 * **É isto que impede a sobreposição.** Enquanto o jacaré era um enfeite plantado
 * numa fração da altura da página, qualquer conteúdo podia aterrissar em cima
 * dele — foi o que o cartão do mapa fez. Um `<section>` com altura mínima reserva
 * o próprio espaço: o navegador empurra o que vem depois, e nada mais pode ocupar
 * essa faixa. Não é calibragem, é layout.
 *
 * A **boca** fica no centro geométrico da seção, de propósito: `biteProgress`
 * chega a 1 quando esse centro alinha com o centro da viewport, e o vaga-lume
 * converge para o centro da viewport. Os dois se encontram por construção.
 */
export function GatorStageSection() {
  const { stageRef, biteProgress } = useGatorStage();
  const prefersReducedMotion = usePrefersReducedMotion();

  /*
   * Coreografia, toda em cima de `biteProgress`:
   *
   *   0,00 → 0,28  emerge da água
   *   0,28 → 0,90  abre a boca progressivamente
   *   0,90 → 1,00  fecha de uma vez: a mordida
   *   depois de 1  engole, a barriga acende forte, o trompete comemora
   *
   * Os valores acima de 1 são alcançáveis: `biteProgress` continua subindo
   * enquanto o palco sobe além do centro da tela.
   */
  const animatedJaw = useTransform(biteProgress, [0.28, 0.9, 1], [0.08, 1, 0.02]);
  const animatedGulp = useTransform(biteProgress, [1, 1.06, 1.16], [1, 1.08, 1]);
  const animatedGlow = useTransform(biteProgress, [1, 1.1], [0, 1]);
  const animatedNotes = useTransform(biteProgress, [1.06, 1.18], [0, 1]);
  const animatedRise = useTransform(biteProgress, [0, 0.3], [120, 0]);
  const animatedFade = useTransform(biteProgress, [0, 0.16], [0, 1]);

  /*
   * Quem pediu menos movimento recebe o desfecho, não a animação: jacaré parado,
   * boca entreaberta, barriga já acesa. A recompensa da história continua lá.
   */
  const still = {
    jaw: useMotionValue(0.22),
    one: useMotionValue(1),
    zero: useMotionValue(0),
  };

  const jawOpen = prefersReducedMotion ? still.jaw : animatedJaw;
  const gulp = prefersReducedMotion ? still.one : animatedGulp;
  const bellyGlow = prefersReducedMotion ? still.one : animatedGlow;
  const notesOpacity = prefersReducedMotion ? still.one : animatedNotes;
  const opacity = prefersReducedMotion ? still.one : animatedFade;
  const rise = prefersReducedMotion ? still.zero : animatedRise;

  return (
    <section
      ref={stageRef}
      id="lago"
      aria-labelledby="lago-caption"
      className="relative flex min-h-[74svh] w-full flex-col items-center justify-end overflow-hidden px-5 pb-12"
    >
      {/*
        A boca é ancorada no centro da seção. O deslocamento vem do próprio
        viewBox do desenho (ver GATOR_MOUTH_OFFSET) para que seja a BOCA, e não o
        centro da ilustração, a coincidir com o centro do palco.
      */}
      {/*
        Dois elementos, e não um: o Motion escreve `transform` para animar `y`,
        então o deslocamento da boca precisa morar num nó de fora — misturar os
        dois faz um sobrescrever o outro.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 w-[260px] sm:w-[320px]"
        style={{ transform: `translate(-${GATOR_MOUTH_OFFSET.x}, -${GATOR_MOUTH_OFFSET.y})` }}
      >
        <motion.div style={{ opacity, y: rise }}>
          <TrumpetGator
            jawOpen={jawOpen}
            bellyGlow={bellyGlow}
            gulp={gulp}
            notesOpacity={notesOpacity}
          />
        </motion.div>
      </div>

      {/* Legenda: dá conteúdo real à seção, então ela não parece um vão vazio
          caso a ilustração não renderize por qualquer motivo. */}
      <p id="lago-caption" className="text-cream/45 font-script relative text-center text-xl">
        {invitationCopy.gator.caption}
      </p>
    </section>
  );
}
