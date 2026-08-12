import type { Rsvp } from '../rsvp.aggregate';
import type { GuestName } from '../value-objects/guest-name';

/** O que pode acontecer com uma tentativa de resposta. */
export type RsvpEligibility =
  /** Ninguém respondeu ainda por esta conta nem por este nome. */
  | { readonly kind: 'FIRST_RESPONSE' }
  /** Esta conta já respondeu, e é a mesma pessoa voltando. */
  | { readonly kind: 'OWN_RESPONSE'; readonly rsvp: Rsvp }
  /** Este nome já tem resposta, enviada por outra conta. */
  | { readonly kind: 'NAME_ANSWERED_ELSEWHERE'; readonly registeredGuestName: GuestName };

/**
 * Domain Service. Decide se uma resposta pode ser registrada.
 *
 * Existe como serviço de domínio porque a regra **atravessa agregados**: ela
 * compara a tentativa atual com outras `Rsvp` que já existem. Dentro de `Rsvp`,
 * um agregado precisaria conhecer os outros; solta no caso de uso, viraria um
 * `if` escondido no meio da orquestração.
 *
 * ## A conta é a identidade
 *
 * Desde que responder exige login, a regra "uma resposta por convidado" se apoia
 * na conta verificada, não mais no aparelho. É mais forte e mais justa:
 *
 *  - **mais forte**, porque burlar exige criar contas de verdade no Google, não
 *    apagar um cookie;
 *  - **mais justa**, porque o bloqueio por aparelho reprovava gente honesta. Mãe
 *    e pai que dividem o mesmo celular são duas pessoas e devem poder responder
 *    as duas. Com contas distintas, agora podem.
 *
 * Os sinais de aparelho continuam sendo gravados na resposta como registro de
 * auditoria, mas já não recusam ninguém.
 *
 * ## A regra do nome continua
 *
 * Se um nome já foi usado por outra conta, a segunda tentativa é recusada em vez
 * de sobrescrever. Sem isso, digitar o nome de outra pessoa apagaria a resposta
 * dela. Homônimos de verdade resolvem acrescentando um sobrenome ou um apelido.
 */
export const RsvpEligibilityPolicy = {
  decide(input: {
    /** Resposta já enviada por esta conta, se houver. */
    fromAccount: Rsvp | null;
    /** Resposta já feita com o nome pedido agora, por qualquer conta. */
    underName: Rsvp | null;
  }): RsvpEligibility {
    const { fromAccount, underName } = input;

    if (fromAccount !== null) {
      /*
       * A pessoa pode estar trocando o próprio nome, e o nome novo pode já
       * pertencer a outra conta. Sem esta comparação, a troca passaria pela
       * política e só explodiria no `UNIQUE(guest_key)` do banco, virando um
       * erro técnico incompreensível em vez de uma recusa explicada.
       *
       * Comparação por id de agregado, não por nome: `underName` ser a própria
       * resposta é o caso normal de quem reenvia sem mudar nada.
       */
      if (underName !== null && !underName.id.equals(fromAccount.id)) {
        return { kind: 'NAME_ANSWERED_ELSEWHERE', registeredGuestName: underName.guestName };
      }
      return { kind: 'OWN_RESPONSE', rsvp: fromAccount };
    }

    // Nome tomado por outra conta. `fromAccount` é nulo aqui, então `underName`
    // pertence necessariamente a outra pessoa.
    if (underName !== null) {
      return { kind: 'NAME_ANSWERED_ELSEWHERE', registeredGuestName: underName.guestName };
    }

    return { kind: 'FIRST_RESPONSE' };
  },
};
