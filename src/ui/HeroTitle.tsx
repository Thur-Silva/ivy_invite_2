'use client';

import { motion, type Variants } from 'motion/react';

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.25 } },
};

/** Cada letra cai do alto girando, como uma carta virando. */
const letter: Variants = {
  hidden: { opacity: 0, y: 48, rotateX: -75, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

const subtitle: Variants = {
  hidden: { opacity: 0, letterSpacing: '0.6em' },
  visible: {
    opacity: 1,
    letterSpacing: '0.3em',
    transition: { duration: 1.1, delay: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Nome da aniversariante com entrada letra por letra.
 *
 * O nome completo fica em `sr-only` num `h1` único, e a versão decorativa é
 * `aria-hidden`: leitor de tela anuncia "Ivy faz 2 anos" uma vez, limpo, sem as
 * letras soltas que a animação exige.
 *
 * Cada letra recebe `.text-foil` individualmente e todas iniciam a animação de
 * brilho no mesmo tick, então o reflexo dourado atravessa o nome em sincronia
 * em vez de brigar letra a letra.
 */
export function HeroTitle({ name, turningAge }: { name: string; turningAge: number }) {
  return (
    <h1 className="mt-2">
      <span className="sr-only">
        {name} faz {turningAge} anos
      </span>

      <motion.span
        aria-hidden="true"
        variants={container}
        initial="hidden"
        animate="visible"
        className="font-display block text-[clamp(4rem,26vw,7rem)] leading-[0.95] font-bold [perspective:600px]"
      >
        {[...name].map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            variants={letter}
            className="text-foil inline-block will-change-transform"
          >
            {char}
          </motion.span>
        ))}
      </motion.span>

      <motion.span
        aria-hidden="true"
        variants={subtitle}
        initial="hidden"
        animate="visible"
        className="font-display text-cream/80 mt-1 block text-lg uppercase sm:text-xl"
      >
        faz {turningAge} anos
      </motion.span>
    </h1>
  );
}
