'use client';

import { useScroll, useSpring, type MotionValue } from 'motion/react';
import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from 'react';

interface GatorStage {
  /** Vai na `<section>` do palco: é o que o Motion mede. */
  readonly stageRef: RefObject<HTMLElement | null>;
  /**
   * 0 quando o palco começa a entrar na tela, **1 no instante exato em que o
   * centro do palco encontra o centro da viewport** — que é onde a boca está.
   */
  readonly biteProgress: MotionValue<number>;
}

const GatorStageContext = createContext<GatorStage | null>(null);

/**
 * Coordena o vaga-lume (camada de fundo) com o jacaré (seção no fluxo).
 *
 * ## Por que existe
 *
 * Antes o jacaré era plantado numa fração fixa da altura do documento (0,9) e o
 * encontro com o vaga-lume saía de uma dedução matemática elegante — mas que
 * assumia o layout. Bastou a página ganhar uma seção para o cartão do mapa cair
 * exatamente em cima dele.
 *
 * A troca é deliberada: **medir é mais robusto que deduzir.** O jacaré agora vive
 * numa `<section>` de verdade, que ocupa espaço no fluxo e por definição não pode
 * ser sobreposta por nada. E o instante da mordida deixa de ser um número mágico:
 * vem de `offset: ['start end', 'center center']`, ou seja, `biteProgress` chega a
 * 1 quando o centro do palco alinha com o centro da tela.
 *
 * Como a **boca** é posicionada no centro do palco e o vaga-lume converge para o
 * centro da viewport, os dois se encontram por construção — em qualquer altura de
 * página, com qualquer quantidade de seções, em qualquer tela. O Motion cuida da
 * medição e do resize.
 */
export function GatorStageProvider({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  });

  // Mola suave: o bicho tem peso, não fica colado na rolagem.
  const biteProgress = useSpring(scrollYProgress, {
    stiffness: 55,
    damping: 26,
    mass: 1,
  });

  const stage = useMemo<GatorStage>(() => ({ stageRef, biteProgress }), [biteProgress]);

  return <GatorStageContext.Provider value={stage}>{children}</GatorStageContext.Provider>;
}

export function useGatorStage(): GatorStage {
  const stage = useContext(GatorStageContext);
  if (stage === null) {
    throw new Error('useGatorStage precisa estar dentro de <GatorStageProvider>.');
  }
  return stage;
}
