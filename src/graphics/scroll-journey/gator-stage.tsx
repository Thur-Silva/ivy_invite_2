'use client';

import { useScroll, useSpring, type MotionValue } from 'motion/react';
import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from 'react';

interface GatorStage {
  /** Vai na `<section>` do palco: é o que o Motion mede. */
  readonly stageRef: RefObject<HTMLElement | null>;
  /** 0 quando o palco começa a entrar na tela, 1 quando termina de entrar. */
  readonly biteProgress: MotionValue<number>;
}

const GatorStageContext = createContext<GatorStage | null>(null);

/**
 * Coordena o vaga-lume da trilha (camada de fundo) com o jacaré (seção no fluxo).
 *
 * ## A escolha do `offset` é a parte que importa
 *
 * `['start end', 'end end']` significa: **0** quando o topo do palco toca a base
 * da tela, **1** quando a base do palco toca a base da tela. Ou seja, quando o
 * palco terminou de entrar por baixo.
 *
 * Isso não é estilo, é a única janela que **sempre se completa**. A tentativa
 * anterior usava `'center center'` (centro do palco no centro da tela), que exige
 * cerca de meia viewport de conteúdo depois da seção para ser alcançável. O
 * rodapé tem ~200px. Resultado: `biteProgress` empacava em ~0,8, a mordida nunca
 * disparava, e o comportamento mudava conforme a altura da tela.
 *
 * Com `'end end'`, rolar até o fim sempre leva a base do palco à base da tela. E
 * de fato a ultrapassa, porque o rodapé ainda vem depois. O progresso chega a 1
 * em qualquer resolução, com qualquer quantidade de conteúdo.
 *
 * ## O que este progresso NÃO precisa garantir
 *
 * Ele não posiciona nada. O encontro entre vaga-lume e boca acontece dentro do
 * SVG do jacaré, no mesmo sistema de coordenadas (ver `PondGator`). Aqui só se
 * decide *quando*, nunca *onde*. Que é justamente o que torna o resultado
 * independente de resolução.
 */
export function GatorStageProvider({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'end end'],
  });

  // Mola suave: o bicho tem peso, não fica colado na rolagem.
  const biteProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 26,
    mass: 0.9,
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
