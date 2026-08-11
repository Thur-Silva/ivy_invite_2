'use client';

import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { usePrefersReducedMotion } from '@/ui/hooks/use-environment';

/**
 * Pétalas e folhas espalhadas pela altura do documento.
 *
 * `depth` define a velocidade de parallax: valores pequenos ficam "longe" e quase
 * paradas, valores maiores acompanham a rolagem e passam rápido. É o que dá
 * profundidade à cena sem custar um segundo canvas WebGL.
 */
const PETALS = [
  { left: 7, top: 14, size: 22, depth: 0.05, tint: '#f4a6b8', spin: -18, sway: '9s' },
  { left: 88, top: 22, size: 15, depth: 0.13, tint: '#ffd9e1', spin: 24, sway: '7s' },
  { left: 16, top: 38, size: 12, depth: 0.09, tint: '#6ec49b', spin: 40, sway: '11s' },
  { left: 82, top: 47, size: 26, depth: 0.04, tint: '#3fa07a', spin: -32, sway: '13s' },
  { left: 11, top: 61, size: 17, depth: 0.11, tint: '#f4a6b8', spin: 12, sway: '8s' },
  { left: 90, top: 72, size: 13, depth: 0.07, tint: '#e9c46a', spin: -25, sway: '10s' },
  { left: 22, top: 86, size: 20, depth: 0.06, tint: '#ffd9e1', spin: 30, sway: '12s' },
] as const;

type PetalConfig = (typeof PETALS)[number];

function Petal({ petal, scrollY }: { petal: PetalConfig; scrollY: MotionValue<number> }) {
  const y = useTransform(scrollY, (value) => value * petal.depth);

  return (
    <motion.span
      style={{
        y,
        left: `${petal.left}%`,
        top: `${petal.top}%`,
        width: petal.size,
        rotate: petal.spin,
        animationDuration: petal.sway,
      }}
      className="animate-sway absolute block"
    >
      <svg viewBox="0 0 24 32" role="presentation" className="h-auto w-full">
        {/* Pétala: duas curvas espelhadas com nervura central. */}
        <path d="M12 1 C19 9 21 20 12 31 C3 20 5 9 12 1 Z" fill={petal.tint} fillOpacity="0.42" />
        <path
          d="M12 4 L12 28"
          stroke={petal.tint}
          strokeOpacity="0.55"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </svg>
    </motion.span>
  );
}

/** Camada de parallax entre o lago WebGL e o conteúdo. */
export function DriftingPetals() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  if (prefersReducedMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[2] overflow-hidden">
      {PETALS.map((petal) => (
        <Petal key={`${petal.left}:${petal.top}`} petal={petal} scrollY={scrollY} />
      ))}
    </div>
  );
}
