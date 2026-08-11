'use client';

import { motion } from 'motion/react';
import { LilyGlyph } from '@/ui/ornaments/Glyphs';

/**
 * Explica por que a resposta foi recusada, quando não há nada a corrigir.
 *
 * Duas situações distintas, duas saídas distintas:
 *
 *  - **DEVICE** — este aparelho já confirmou por alguém. O caminho é a outra
 *    pessoa responder do celular dela. Se quiserem alterar a resposta que já
 *    existe, basta digitar aquele mesmo nome, então o botão volta ao formulário.
 *  - **NAME** — o nome já respondeu de outro aparelho. Aqui não há saída pelo
 *    site: ou usam o celular original, ou falam com os anfitriões.
 *
 * O tom importa. É um convite de festa infantil, e a pessoa acabou de levar um
 * "não" — o texto explica o motivo sem soar como catraca de estádio.
 */
export function ResponseLockedNotice({
  reason,
  message,
  registeredGuestName,
  onRetry,
}: {
  reason: 'DEVICE' | 'NAME';
  message: string;
  registeredGuestName?: string;
  onRetry: () => void;
}) {
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

      <h3 className="font-display text-gold-400 text-xl">
        {reason === 'DEVICE' ? 'Uma resposta por convidado' : 'Este nome já respondeu'}
      </h3>

      <p className="text-cream/85 max-w-[36ch] text-sm leading-relaxed text-balance">{message}</p>

      {reason === 'DEVICE' && registeredGuestName !== undefined ? (
        <p className="text-cream/55 max-w-[36ch] text-xs leading-relaxed">
          Precisa corrigir a resposta de{' '}
          <strong className="text-lily-300">{registeredGuestName}</strong>? Volte ao formulário e
          envie com esse mesmo nome.
        </p>
      ) : null}

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
