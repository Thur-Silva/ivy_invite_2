'use client';

import { motion, useMotionValue, useTransform } from 'motion/react';
import { useGatorStage } from '@/graphics/scroll-journey/gator-stage';
import { PondGator } from '@/graphics/scroll-journey/PondGator';
import { usePrefersReducedMotion } from '@/ui/hooks/use-environment';
import { invitationCopy } from '../_content/invitation-copy';

/**
 * O palco do jacaré. Uma seção de verdade, no fluxo do documento.
 *
 * **É isto que impede a sobreposição.** Enquanto o jacaré era um enfeite plantado
 * numa fração da altura da página, qualquer conteúdo podia aterrissar em cima
 * dele. Foi o que o cartão do mapa fez. Um `<section>` ocupa espaço: o navegador
 * empurra o que vem depois, hoje e em qualquer seção futura.
 *
 * A altura vem do **conteúdo**, não de um `min-h` em unidades de viewport. Fixar
 * `74svh` reservava uma faixa quase vazia, e o vão entre o mapa e o jacaré ficava
 * grande o bastante para o convidado desistir antes de chegar lá. Aqui a seção
 * mede o que o desenho precisa e nada além. E é essa altura que também define,
 * naturalmente, quanto de rolagem a animação leva para acontecer.
 */
export function GatorStageSection() {
  const { stageRef, biteProgress } = useGatorStage();
  const prefersReducedMotion = usePrefersReducedMotion();

  /*
   * Coreografia, toda sobre `biteProgress` (0 = palco entrando, 1 = palco dentro):
   *
   *   0,00 → 0,20  emerge da água
   *   0,20 → 0,58  abre a boca progressivamente
   *   0,24 → 0,66  o vaga-lume entra em quadro e mergulha na goela
   *   0,66 → 0,76  fecha de uma vez: a mordida
   *   0,68 → 0,75  a luz se apaga: engolido
   *   0,76 → 0,95  engole e a barriga acende forte
   *
   * Tudo termina em 0,95 de propósito: 1 é garantidamente alcançável, valores
   * acima disso dependem da altura do rodapé e não são de se confiar.
   */
  const animatedRise = useTransform(biteProgress, [0, 0.2], [90, 0]);
  const animatedFade = useTransform(biteProgress, [0, 0.14], [0, 1]);
  const animatedJaw = useTransform(biteProgress, [0.2, 0.58, 0.66, 0.76], [0.06, 1, 1, 0.02]);
  const animatedApproach = useTransform(biteProgress, [0.24, 0.66], [0, 1]);
  const animatedSpark = useTransform(biteProgress, [0.22, 0.32, 0.68, 0.75], [0, 1, 1, 0]);
  const animatedGulp = useTransform(biteProgress, [0.76, 0.83, 0.92], [1, 1.08, 1]);
  const animatedGlow = useTransform(biteProgress, [0.76, 0.95], [0, 1]);

  /*
   * Quem pediu menos movimento recebe o desfecho, não a animação: jacaré parado,
   * boca entreaberta, barriga acesa, vaga-lume já engolido.
   */
  const still = {
    jaw: useMotionValue(0.2),
    one: useMotionValue(1),
    zero: useMotionValue(0),
  };

  const jawOpen = prefersReducedMotion ? still.jaw : animatedJaw;
  const approach = prefersReducedMotion ? still.one : animatedApproach;
  const fireflyOpacity = prefersReducedMotion ? still.zero : animatedSpark;
  const gulp = prefersReducedMotion ? still.one : animatedGulp;
  const bellyGlow = prefersReducedMotion ? still.one : animatedGlow;
  const opacity = prefersReducedMotion ? still.one : animatedFade;
  const rise = prefersReducedMotion ? still.zero : animatedRise;

  return (
    <section
      ref={stageRef}
      id="lago"
      aria-labelledby="lago-caption"
      className="relative flex w-full flex-col items-center justify-center gap-3 px-5 py-10"
    >
      <motion.div
        aria-hidden="true"
        style={{ opacity, y: rise }}
        className="pointer-events-none w-[250px] sm:w-[300px]"
      >
        <PondGator
          jawOpen={jawOpen}
          approach={approach}
          fireflyOpacity={fireflyOpacity}
          bellyGlow={bellyGlow}
          gulp={gulp}
        />
      </motion.div>

      {/* Legenda: dá conteúdo real à seção, então ela não parece um vão vazio
          caso a ilustração não renderize por qualquer motivo. */}
      <p id="lago-caption" className="text-cream/45 font-script text-center text-xl">
        {invitationCopy.gator.caption}
      </p>
    </section>
  );
}
