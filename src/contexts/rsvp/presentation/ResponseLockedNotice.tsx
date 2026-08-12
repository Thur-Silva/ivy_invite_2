'use client';

import { motion } from 'motion/react';
import { LilyGlyph } from '@/ui/ornaments/Glyphs';

const COPY = {
  NAME: {
    title: 'Este nome já respondeu',
    hint: 'Se forem duas pessoas com o mesmo nome, acrescente o sobrenome para diferenciar.',
  },
  UNAUTHENTICATED: {
    title: 'Sua sessão expirou',
    hint: 'Recarregue a página e entre de novo. Nada do que você respondeu antes se perdeu.',
  },
} as const;

/**
 * Explica por que a resposta foi recusada, quando não há nada a corrigir no
 * formulário em si.
 *
 * Duas situações, duas saídas:
 *
 *  - **NAME**. O nome já foi usado por outra conta. A saída é diferenciar com o
 *    sobrenome, ou falar com os anfitriões se for engano.
 *  - **UNAUTHENTICATED**. O cookie de sessão venceu entre carregar a página e
 *    enviar. Recarregar e entrar de novo resolve.
 *
 * O tom importa. É um convite de festa infantil, e a pessoa acabou de levar um
 * "não". O texto explica o motivo e aponta a saída, sem soar como catraca.
 */
export function ResponseLockedNotice({
  reason,
  message,
  onRetry,
}: {
  reason: 'NAME' | 'UNAUTHENTICATED';
  message: string;
  onRetry: () => void;
}) {
  const copy = COPY[reason];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="surface-pad flex flex-col items-center gap-4 rounded-3xl px-6 py-8 text-center"
      role="status"
    >
      <span className="text-blush-500">
        <LilyGlyph className="h-12 w-12" />
      </span>

      <h3 className="font-display text-gold-400 text-xl">{copy.title}</h3>

      <p className="text-cream/85 max-w-[36ch] text-sm leading-relaxed text-balance">{message}</p>

      <p className="text-cream/55 max-w-[36ch] text-xs leading-relaxed">{copy.hint}</p>

      <button
        type="button"
        onClick={onRetry}
        className="text-cream/70 decoration-gold-500/50 hover:text-cream mt-1 rounded-full px-4 py-2 text-xs font-semibold tracking-wide underline decoration-dotted underline-offset-4 transition"
      >
        Voltar ao formulário
      </button>
    </motion.div>
  );
}
