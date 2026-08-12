import type { Rsvp } from './rsvp.aggregate';
import type { GuestKey } from './value-objects/guest-key';
import type { RespondentIdentity } from './value-objects/respondent-identity';

/**
 * Port (driven side of the hexagon). The collection of `Rsvp` aggregates as
 * the domain wishes it existed.
 *
 * As duas buscas existem porque uma resposta tem **duas identidades**: o nome do
 * convidado e quem a enviou. `RsvpEligibilityPolicy` precisa das duas para
 * decidir se a tentativa é uma pessoa voltando, uma pessoa nova, ou alguém
 * tentando responder por outro.
 *
 * Métodos de consulta para o painel do anfitrião chegam com o PBI-05.
 */
export interface RsvpRepository {
  findByGuestKey(guestKey: GuestKey): Promise<Rsvp | null>;

  /**
   * Resposta já enviada por este respondente, se houver.
   *
   * "Este respondente" segue a regra de `RespondentIdentity.isSameRespondentAs`:
   * mesmo token **ou** (mesmo aparelho **e** mesma rede). Toda implementação
   * precisa honrar exatamente essa regra.
   */
  findByRespondent(identity: RespondentIdentity): Promise<Rsvp | null>;

  /** Creates or updates the aggregate as a whole. Must be atomic per guest. */
  save(rsvp: Rsvp): Promise<void>;
}
