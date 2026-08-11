'use client';

import { motion } from 'motion/react';
import { cn } from '@/ui/cn';

/**
 * Divisor dourado que **se desenha** quando entra em tela, com a vitória-régia
 * desabrochando no centro.
 *
 * Substitui o divisor estático nos cabeçalhos de seção: em vez de a seção
 * simplesmente aparecer, ela é anunciada por um traço que corre para os dois
 * lados e por uma flor que abre. `viewport once` porque numa leitura de celular
 * conteúdo que reanima a cada passagem parece defeito.
 */
export function AnimatedFlourish({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 240 24"
      role="presentation"
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      className={cn('h-6 w-full max-w-[240px]', className)}
    >
      <defs>
        <linearGradient id="animated-flourish-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9a227" stopOpacity="0" />
          <stop offset="50%" stopColor="#e9c46a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Os dois traços correm do centro para fora, na mesma duração. */}
      <motion.path
        d="M96 12 H0"
        stroke="url(#animated-flourish-line)"
        strokeWidth="1.5"
        variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      <motion.path
        d="M144 12 H240"
        stroke="url(#animated-flourish-line)"
        strokeWidth="1.5"
        variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />

      <motion.g
        transform="translate(120 12)"
        variants={{
          hidden: { scale: 0, rotate: -90, opacity: 0 },
          visible: { scale: 1, rotate: 0, opacity: 1 },
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.35 }}
      >
        <path d="M0 -9 C4 -4 4 4 0 9 C-4 4 -4 -4 0 -9 Z" fill="#f4a6b8" />
        <path d="M-9 0 C-4 -4 4 -4 9 0 C4 4 -4 4 -9 0 Z" fill="#ffd9e1" fillOpacity="0.85" />
        <circle cx="0" cy="0" r="2.4" fill="#e9c46a" />
      </motion.g>
    </motion.svg>
  );
}
