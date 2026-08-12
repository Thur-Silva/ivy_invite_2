'use client';

import { motion } from 'motion/react';
import type { AttendanceDecisionValue } from '../domain/value-objects/attendance-decision';
import type { SubmissionStatus } from '../application/dto/submit-rsvp.dto';
import { CrownIcon } from '@/ui/ornaments/CrownIcon';
import { FrogPrinceIcon } from '@/ui/ornaments/FrogPrinceIcon';

/**
 * Confirmation panel that replaces the form once an answer is recorded.
 *
 * The wax-seal stamp is the reward for finishing the only task this page asks
 * of the guest, so it earns a heavier animation than anything else on the page.
 */
export function RoyalSeal({
  guestFirstName,
  decision,
  submission,
  onEdit,
}: {
  guestFirstName: string;
  decision: AttendanceDecisionValue;
  submission: SubmissionStatus;
  onEdit: () => void;
}) {
  const isAttending = decision === 'ATTENDING';

  const headline = isAttending
    ? `Que alegria, ${guestFirstName}!`
    : `Obrigada por avisar, ${guestFirstName}.`;

  const body = isAttending
    ? 'Sua presença está guardada no reino. Nos vemos na festa da Ivy!'
    : 'Vamos sentir sua falta, mas a Ivy manda um beijo de princesa pra você.';

  const note =
    submission === 'UPDATED'
      ? 'Atualizamos sua resposta anterior.'
      : submission === 'UNCHANGED'
        ? 'Sua resposta já estava registrada assim.'
        : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="surface-pad flex flex-col items-center gap-4 rounded-3xl px-6 py-8 text-center"
      role="status"
    >
      <motion.div
        initial={{ scale: 2.2, rotate: -18, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
        className="w-20"
      >
        {isAttending ? <CrownIcon /> : <FrogPrinceIcon />}
      </motion.div>

      <h3 className="font-display text-gold-400 text-2xl">{headline}</h3>
      <p className="text-cream/85 max-w-[34ch] text-sm leading-relaxed text-balance">{body}</p>

      {note !== null ? <p className="text-lily-300 text-xs">{note}</p> : null}

      <button
        type="button"
        onClick={onEdit}
        className="text-cream/70 decoration-gold-500/50 hover:text-cream mt-1 rounded-full px-4 py-2 text-xs font-semibold tracking-wide underline decoration-dotted underline-offset-4 transition"
      >
        Mudar minha resposta
      </button>
    </motion.div>
  );
}
