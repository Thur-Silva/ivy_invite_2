'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useActionState, useEffect, useId, useState } from 'react';
import { cn } from '@/ui/cn';
import { CrownGlyph, LilyGlyph } from '@/ui/ornaments/Glyphs';
import { signOutGuest } from './actions/auth.actions';
import { submitRsvpAction } from './actions/submit-rsvp.action';
import { DeviceTraitsField } from './DeviceTraitsField';
import { ResponseLockedNotice } from './ResponseLockedNotice';
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
export function RsvpForm({
  suggestedName,
  accountEmail,
}: {
  /**
   * Primeiro nome deduzido do e-mail da conta. É palpite, não imposição: entra
   * como `defaultValue` de um input não controlado, então a pessoa apaga e
   * digita o que quiser sem que o React devolva o valor antigo.
   */
  suggestedName: string;
  /** Mostrado no rodapé do cartão para a pessoa saber com qual conta está. */
  accountEmail: string;
}) {
  const [state, formAction, isPending] = useActionState(submitRsvpAction, INITIAL_RSVP_FORM_STATE);

  /**
   * "Mudar minha resposta" stores the state object the guest chose to leave,
   * instead of a boolean that an effect would have to reset. A new submission
   * produces a new state object, so the seal comes back on its own. Derived
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

  const dismissed = dismissedState === state;
  const showSeal = state.status === 'success' && !dismissed;
  const showLocked = state.status === 'locked' && !dismissed;
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
      ) : showLocked && state.status === 'locked' ? (
        <ResponseLockedNotice
          key="locked"
          reason={state.reason}
          message={state.message}
          onRetry={() => setDismissedState(state)}
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
          <DeviceTraitsField />

          <div className="flex flex-col gap-2.5">
            {/*
              Rótulo e dica são um bloco só, com respiro menor entre si do que
              entre o bloco e o campo. Antes eram três irmãos num `gap-2` com um
              `-mt-1` puxando a dica para cima: hack que deixava os espaços
              desiguais e mudava conforme o texto quebrasse de linha.
            */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor={nameFieldId}
                className="font-display text-gold-400 text-sm tracking-wide"
              >
                Confira seu nome
              </label>
              <p className="text-cream/45 text-xs leading-relaxed">
                Preenchemos com o que achamos no seu e-mail. Corrija se não for assim que te chamam.
              </p>
            </div>
            <input
              id={nameFieldId}
              name={RSVP_FIELD_NAMES.guestName}
              type="text"
              required
              maxLength={GUEST_NAME_MAX_LENGTH}
              defaultValue={previousValues?.guestName ?? suggestedName}
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

          {/*
            `fieldset` fica como bloco comum, sem `flex`. `legend` é renderizado
            fora do fluxo normal pelo navegador, então dentro de um container
            flex ele ignora o `gap` e o espaçamento passa a depender de um `mb`
            que soma ou não com o gap dependendo do browser. Com bloco simples,
            o respiro vem só do `mb` do próprio legend e é previsível.
          */}
          <fieldset className="m-0 border-0 p-0">
            <legend className="font-display text-gold-400 mb-3 p-0 text-sm tracking-wide">
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
                Uma resposta por convidado: cada pessoa confirma do próprio celular.
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

          {/*
            `gap-y` importa: sem ele, quando o e-mail é longo e o "trocar de
            conta" cai para a linha de baixo, as duas linhas se encostam.
            `break-all` no e-mail evita que um endereço sem espaços estoure a
            largura do cartão em tela estreita.
          */}
          <p className="text-cream/35 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[0.7rem] leading-relaxed">
            <span className="break-all">Conectado como {accountEmail}</span>
            <button
              type="button"
              onClick={() => void signOutGuest()}
              className="decoration-cream/30 hover:text-cream/70 underline decoration-dotted underline-offset-4 transition"
            >
              trocar de conta
            </button>
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
