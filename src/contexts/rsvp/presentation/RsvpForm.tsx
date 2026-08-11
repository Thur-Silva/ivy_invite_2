'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useActionState, useEffect, useId, useState } from 'react';
import { cn } from '@/ui/cn';
import { CrownGlyph, LilyGlyph } from '@/ui/ornaments/Glyphs';
import { submitRsvpAction } from './actions/submit-rsvp.action';
import { RoyalSeal } from './RoyalSeal';
import {
  GUEST_NAME_MAX_LENGTH,
  INITIAL_RSVP_FORM_STATE,
  RSVP_FIELD_NAMES,
  type RsvpFormState,
} from './rsvp-form.contract';

const CHOICES = [
  {
    value: 'ATTENDING',
    label: 'Eu vou!',
    hint: 'Conta comigo na festa',
    Glyph: CrownGlyph,
    accent: 'peer-checked:border-gold-500 peer-checked:bg-gold-500/15 peer-checked:text-gold-400',
    glow: 'peer-checked:shadow-[0_0_28px_-6px_rgba(233,196,106,0.55)]',
  },
  {
    value: 'NOT_ATTENDING',
    label: 'Não vou poder',
    hint: 'Mas mando meu carinho',
    Glyph: LilyGlyph,
    accent: 'peer-checked:border-lily-400 peer-checked:bg-lily-400/15 peer-checked:text-lily-300',
    glow: 'peer-checked:shadow-[0_0_28px_-6px_rgba(63,160,122,0.55)]',
  },
] as const;

/**
 * The only interactive element of the invitation.
 *
 * Progressive enhancement by construction: a real `<form>` posting to a Server
 * Action, native radio inputs, no client-side validation gate. With JavaScript
 * disabled the guest still gets a full page response and their RSVP is stored;
 * with JavaScript the same submission animates in place.
 */
export function RsvpForm() {
  const [state, formAction, isPending] = useActionState(submitRsvpAction, INITIAL_RSVP_FORM_STATE);

  /**
   * "Mudar minha resposta" stores the state object the guest chose to leave,
   * instead of a boolean that an effect would have to reset. A new submission
   * produces a new state object, so the seal comes back on its own — derived
   * state, no synchronisation, no cascading render.
   */
  const [dismissedState, setDismissedState] = useState<RsvpFormState | null>(null);

  const nameFieldId = useId();
  const messageId = useId();

  // Celebrate once per confirmed attendance: `state` is a fresh object per
  // submission, so the effect runs exactly once for each of them.
  useEffect(() => {
    if (state.status !== 'success' || state.decision !== 'ATTENDING') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    // Loaded on demand: no guest pays for the confetti bundle before they win.
    void import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 90,
        spread: 70,
        startVelocity: 38,
        origin: { y: 0.7 },
        colors: ['#e9c46a', '#f3d68f', '#f4a6b8', '#ffd9e1', '#6ec49b'],
        disableForReducedMotion: true,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const showSeal = state.status === 'success' && dismissedState !== state;
  const errorMessage =
    state.status === 'invalid' || state.status === 'failed' ? state.message : null;
  const invalidField = state.status === 'invalid' ? state.field : null;
  const previousValues =
    state.status === 'invalid' || state.status === 'failed' ? state.values : null;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showSeal && state.status === 'success' ? (
        <RoyalSeal
          key="seal"
          guestFirstName={state.guestFirstName}
          decision={state.decision}
          submission={state.submission}
          onEdit={() => setDismissedState(state)}
        />
      ) : (
        <motion.form
          key="form"
          action={formAction}
          noValidate
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="surface-pad flex flex-col gap-6 rounded-3xl px-5 py-7 sm:px-7"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor={nameFieldId}
              className="font-display text-gold-400 text-sm tracking-wide"
            >
              Como podemos te chamar?
            </label>
            <input
              id={nameFieldId}
              name={RSVP_FIELD_NAMES.guestName}
              type="text"
              required
              maxLength={GUEST_NAME_MAX_LENGTH}
              defaultValue={previousValues?.guestName ?? ''}
              placeholder="Seu nome"
              autoComplete="name"
              autoCapitalize="words"
              spellCheck={false}
              enterKeyHint="done"
              aria-invalid={invalidField === 'guestName'}
              aria-describedby={errorMessage !== null ? messageId : undefined}
              className={cn(
                'bg-pond-950/60 text-cream w-full rounded-2xl border px-4 py-3.5 text-base',
                'placeholder:text-cream/35 focus:bg-pond-950/80 transition',
                invalidField === 'guestName'
                  ? 'border-blush-500'
                  : 'border-gold-500/25 hover:border-gold-500/45',
              )}
            />
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="font-display text-gold-400 mb-1 text-sm tracking-wide">
              Você vem à festa da Ivy?
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CHOICES.map((choice) => (
                <label key={choice.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name={RSVP_FIELD_NAMES.decision}
                    value={choice.value}
                    defaultChecked={previousValues?.decision === choice.value}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'flex min-h-[68px] items-center gap-3 rounded-2xl border',
                      'border-gold-500/20 bg-pond-950/50 text-cream/80 px-4 py-3 transition',
                      'peer-focus-visible:outline peer-focus-visible:outline-2 active:scale-[0.98]',
                      'peer-focus-visible:outline-gold-500 peer-focus-visible:outline-offset-2',
                      choice.accent,
                      choice.glow,
                      // O glifo cresce e se inclina quando a opção é marcada:
                      // confirmação visual sem depender do radio nativo, que
                      // cada sistema desenha de um jeito. Precisa ser alcançado
                      // por seletor de filho porque o `peer` é irmão deste span,
                      // não do SVG lá dentro.
                      'peer-checked:[&>svg]:scale-110 peer-checked:[&>svg]:-rotate-6',
                      'peer-checked:[&>svg]:opacity-100',
                    )}
                  >
                    <choice.Glyph className="h-7 w-7 shrink-0 opacity-45 transition-all duration-300" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-base font-semibold">{choice.label}</span>
                      <span className="text-cream/55 text-xs">{choice.hint}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p id={messageId} role="alert" aria-live="polite" className="min-h-[1.25rem] text-sm">
            {errorMessage !== null ? (
              <span className="text-blush-500">{errorMessage}</span>
            ) : (
              <span className="text-cream/45">
                Pode responder por mais de uma pessoa enviando um nome por vez.
              </span>
            )}
          </p>

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'group relative w-full overflow-hidden rounded-full px-6 py-4',
              'from-gold-600 via-gold-500 to-gold-400 bg-gradient-to-r',
              'font-display text-pond-950 text-base font-bold tracking-wide',
              'shadow-[0_12px_30px_-12px_rgba(233,196,106,0.7)] transition',
              'active:scale-[0.98] disabled:cursor-progress disabled:opacity-70',
            )}
          >
            {isPending ? 'Enviando…' : 'Enviar minha resposta'}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
