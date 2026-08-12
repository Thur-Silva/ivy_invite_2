import type { Rsvp } from '../rsvp.aggregate';
import type { GuestName } from '../value-objects/guest-name';

/** O que pode acontecer com uma tentativa de resposta. */
export type RsvpEligibility =
  /** Ninguém respondeu ainda por este nome nem deste aparelho. */
  | { readonly kind: 'FIRST_RESPONSE' }
  /** Este respondente já respondeu, e é a mesma pessoa voltando. */
  | { readonly kind: 'OWN_RESPONSE'; readonly rsvp: Rsvp }
  /** Este respondente já respondeu, mas por outra pessoa. */
  | { readonly kind: 'DEVICE_ALREADY_ANSWERED'; readonly registeredGuestName: GuestName }
  /** Este nome já tem resposta, enviada por outro respondente. */
  | { readonly kind: 'NAME_ANSWERED_ELSEWHERE' };

/**
 * Domain Service. Decide se uma resposta pode ser registrada.
 *
 * Existe como serviço de domínio porque a regra **atravessa agregados**: ela
 * compara a tentativa atual com outras `Rsvp` que já existem. Colocá-la dentro
 * de `Rsvp` obrigaria um agregado a conhecer os outros; deixá-la solta no caso de
 * uso a esconderia num `if` no meio da orquestração, onde regra de negócio não
 * pertence e ninguém a encontra depois.
 *
 * Aqui ela é pura: recebe o que já foi lido do repositório, não faz I/O, e é
 * testável sem nada em volta.
 *
 * As duas regras que ela codifica:
 *
 *  1. **Um aparelho responde por uma pessoa só.** Quem já confirmou não pode
 *     confirmar por mais ninguém. Nem por acompanhante, nem por parente.
 *  2. **Uma resposta pertence a quem a criou.** Digitar o nome de alguém em
 *     outro celular não sobrescreve a resposta dessa pessoa.
 *
 * A regra 2 é o que fecha o buraco da regra 1: sem ela, bastaria trocar de
 * aparelho. Ou o mesmo aparelho assumir a resposta de outro. Para o limite
 * deixar de valer.
 */
export const RsvpEligibilityPolicy = {
  decide(input: {
    guestName: GuestName;
    /** Resposta já enviada por este respondente, se houver. */
    fromRespondent: Rsvp | null;
    /** Resposta já feita com este nome, por qualquer respondente. */
    underName: Rsvp | null;
  }): RsvpEligibility {
    const { guestName, fromRespondent, underName } = input;

    if (fromRespondent !== null) {
      // Mesma chave natural = mesma pessoa corrigindo a grafia ou mudando de
      // ideia. Chave diferente = tentativa de responder por outra pessoa.
      return fromRespondent.guestKey.equals(guestName.key())
        ? { kind: 'OWN_RESPONSE', rsvp: fromRespondent }
        : { kind: 'DEVICE_ALREADY_ANSWERED', registeredGuestName: fromRespondent.guestName };
    }

    if (underName !== null) {
      return { kind: 'NAME_ANSWERED_ELSEWHERE' };
    }

    return { kind: 'FIRST_RESPONSE' };
  },
};
