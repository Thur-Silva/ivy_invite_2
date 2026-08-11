'use client';

import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { usePrefersReducedMotion } from '@/ui/hooks/use-environment';
import { LilyGlyph } from '@/ui/ornaments/Glyphs';
import { buildTrailPath, curveX, GATOR_APPROACH, TRAIL_FINALE, TRAIL_STOPS } from './trail-path';
import { GATOR_MOUTH_OFFSET, TrumpetGator } from './TrumpetGator';

/** Calculada uma vez na carga do módulo — a curva nunca muda. */
const TRAIL_PATH = buildTrailPath();

/**
 * Marcador de seção: acende quando o vaga-lume se aproxima e dispara um anel de
 * água ao ser ultrapassado.
 *
 * É o "evento durante o scroll": não é uma animação em loop que roda sozinha, é
 * uma reação a um momento específico da leitura.
 */
function TrailStop({ at, progress }: { at: number; progress: MotionValue<number> }) {
  const lilyOpacity = useTransform(progress, [at - 0.1, at - 0.01], [0.15, 1]);
  const lilyScale = useTransform(progress, [at - 0.1, at - 0.01], [0.45, 1]);
  // A flor gira conforme a leitura passa por ela — o giro é o que torna o
  // marcador um evento, e não só um ponto que acende.
  const lilyRotate = useTransform(progress, [at - 0.12, at + 0.12], [-55, 55]);
  const ringScale = useTransform(progress, [at - 0.05, at + 0.1], [0.3, 3.2]);
  const ringOpacity = useTransform(progress, [at - 0.05, at, at + 0.1], [0, 0.55, 0]);

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ top: `${at * 100}%`, left: `${curveX(at)}%` }}
    >
      <motion.span
        style={{ scale: ringScale, opacity: ringOpacity }}
        className="border-gold-400/70 absolute top-1/2 left-1/2 block h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border"
      />
      <motion.span
        style={{ scale: lilyScale, opacity: lilyOpacity, rotate: lilyRotate }}
        className="text-blush-500 block drop-shadow-[0_0_10px_rgba(244,166,184,0.5)]"
      >
        <LilyGlyph className="h-6 w-6" />
      </motion.span>
    </div>
  );
}

/**
 * Rastro do vaga-lume: pontos que seguem o mesmo caminho com molas cada vez mais
 * moles, então "esticam" atrás dele quando a rolagem é rápida e se recolhem
 * quando ela para.
 */
function TrailSpark({
  progress,
  size,
  opacity,
  alive,
}: {
  progress: MotionValue<number>;
  size: number;
  opacity: number;
  /** 1 enquanto o vaga-lume voa, 0 depois de engolido. */
  alive: MotionValue<number>;
}) {
  const top = useTransform(progress, (value) => `${value * 100}vh`);
  const left = useTransform(progress, (value) => `${curveX(value)}%`);
  const sparkOpacity = useTransform(alive, (value) => value * opacity);

  return (
    <motion.span
      style={{ top, left, width: size, height: size, opacity: sparkOpacity }}
      className="bg-gold-300 absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[1px]"
    />
  );
}

/**
 * A cena que acompanha o convidado do início ao fim da página.
 *
 * Três camadas, todas decorativas e `aria-hidden`:
 *
 *  1. **Trilha** (espaço de documento) — caminho sinuoso que se desenha conforme
 *     a leitura avança, via `pathLength` ligado ao progresso de scroll;
 *  2. **Marcadores** (espaço de documento) — acendem e disparam um anel ao serem
 *     ultrapassados, mais uma coroa como recompensa no fim;
 *  3. **Vaga-lume + rastro** (espaço de viewport) — desce junto com a rolagem,
 *     exatamente sobre a trilha (ver a dedução em `trail-path.ts`).
 *
 * O progresso passa por `useSpring` antes de virar posição: o vaga-lume ganha
 * inércia, ultrapassa um pouco ao parar e volta — a diferença entre "um ponto
 * amarrado ao scroll" e "um bicho voando".
 *
 * Tudo em `z-index: -1`: a cena fica atrás do conteúdo, e os cartões de
 * `backdrop-filter` a capturam desfocada por trás do vidro.
 */
export function ScrollJourney() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();

  const lead = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  const tail1 = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.5 });
  const tail2 = useSpring(scrollYProgress, { stiffness: 48, damping: 18, mass: 0.6 });
  const tail3 = useSpring(scrollYProgress, { stiffness: 30, damping: 16, mass: 0.7 });

  const fireflyTop = useTransform(lead, (value) => `${value * 100}vh`);
  const fireflyLeft = useTransform(lead, (value) => `${curveX(value)}%`);

  /**
   * O bote do jacaré, todo derivado do mesmo `lead` que move o vaga-lume — é o
   * que garante que a boca feche no quadro exato em que a luz chega.
   *
   *   0,81 → 0,86   emerge da água
   *   0,86 → 0,947  abre a boca cada vez mais
   *   0,947 → 0,965 fecha de uma vez: a mordida
   *   0,965 →       engole, a barriga acende e o trompete comemora
   */
  const gatorOpacity = useTransform(lead, [GATOR_APPROACH - 0.05, GATOR_APPROACH], [0, 1]);
  const gatorRise = useTransform(lead, [GATOR_APPROACH - 0.05, GATOR_APPROACH + 0.04], [80, 0]);
  const jawRotate = useTransform(
    lead,
    [GATOR_APPROACH, TRAIL_FINALE - 0.018, TRAIL_FINALE],
    [-4, -34, -2],
  );
  const gulp = useTransform(
    lead,
    [TRAIL_FINALE, TRAIL_FINALE + 0.008, TRAIL_FINALE + 0.022],
    [1, 1.07, 1],
  );
  const bellyGlow = useTransform(lead, [TRAIL_FINALE, TRAIL_FINALE + 0.012, 1], [0, 1, 0.65]);
  const notesOpacity = useTransform(lead, [TRAIL_FINALE + 0.004, TRAIL_FINALE + 0.02], [0, 1]);

  /** 1 enquanto o vaga-lume voa; some no instante da mordida. */
  const fireflyAlive = useTransform(lead, [TRAIL_FINALE - 0.008, TRAIL_FINALE], [1, 0]);

  // Quem pediu menos movimento não recebe um bicho perseguindo a rolagem.
  if (prefersReducedMotion) return null;

  return (
    <>
      {/* Camada em espaço de documento: trilha e marcadores */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[1]">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
          role="presentation"
        >
          <defs>
            <linearGradient id="trail-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e9c46a" stopOpacity="0.15" />
              <stop offset="35%" stopColor="#f3d68f" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#6ec49b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f4a6b8" stopOpacity="0.55" />
            </linearGradient>
          </defs>

          {/* Leito da trilha: sempre visível, indica que há caminho adiante.
              `non-scaling-stroke` é obrigatório aqui — sem ele, o viewBox
              esticado deformaria a espessura do traço. */}
          <path
            d={TRAIL_PATH}
            fill="none"
            stroke="url(#trail-gradient)"
            strokeWidth={9}
            strokeOpacity={0.1}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Trilha percorrida: desenha-se conforme a leitura avança. */}
          <motion.path
            d={TRAIL_PATH}
            fill="none"
            stroke="url(#trail-gradient)"
            strokeWidth={1.8}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ pathLength: lead }}
          />
        </svg>

        {TRAIL_STOPS.map((stop) => (
          <TrailStop key={stop} at={stop} progress={scrollYProgress} />
        ))}

        {/*
          O jacaré é ancorado pela BOCA, não pelo centro do desenho: o
          deslocamento vem de `GATOR_MOUTH_OFFSET`, calculado a partir do próprio
          viewBox. É o que faz o vaga-lume entrar na boca e não na barriga.
        */}
        <div
          className="absolute"
          style={{
            top: `${TRAIL_FINALE * 100}%`,
            left: `${curveX(TRAIL_FINALE)}%`,
            transform: `translate(-${GATOR_MOUTH_OFFSET.x}, -${GATOR_MOUTH_OFFSET.y})`,
          }}
        >
          <motion.div
            style={{ opacity: gatorOpacity, y: gatorRise }}
            className="w-[210px] sm:w-[260px]"
          >
            <TrumpetGator
              jawRotate={jawRotate}
              bellyGlow={bellyGlow}
              gulp={gulp}
              notesOpacity={notesOpacity}
            />
          </motion.div>
        </div>
      </div>

      {/* Camada em espaço de viewport: vaga-lume e rastro */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[1]">
        <TrailSpark progress={tail3} size={4} opacity={0.18} alive={fireflyAlive} />
        <TrailSpark progress={tail2} size={6} opacity={0.3} alive={fireflyAlive} />
        <TrailSpark progress={tail1} size={8} opacity={0.45} alive={fireflyAlive} />

        <motion.span
          style={{ top: fireflyTop, left: fireflyLeft, opacity: fireflyAlive }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
        >
          <span className="animate-float block">
            <span className="animate-twinkle bg-gold-300/25 absolute -inset-4 block rounded-full blur-md" />
            <span className="bg-cream relative block h-2.5 w-2.5 rounded-full shadow-[0_0_18px_7px_rgba(255,233,168,0.55)]" />
          </span>
        </motion.span>
      </div>
    </>
  );
}
