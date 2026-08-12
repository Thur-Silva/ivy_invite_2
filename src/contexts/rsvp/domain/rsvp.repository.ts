import type { Rsvp } from './rsvp.aggregate';
import type { GuestAccount } from './value-objects/guest-account';
import type { GuestKey } from './value-objects/guest-key';
import type { RespondentIdentity } from './value-objects/respondent-identity';

/**
 * Port (driven side of the hexagon). A coleção de `Rsvp` como o domínio gostaria
 * que ela existisse.
 *
 * São três buscas porque uma resposta tem três identidades, em ordem de força:
 *
 *  1. **a conta verificada** (`findByAccount`), provada pelo Google.
 *     É a que carrega a regra "uma resposta por convidado";
 *  2. **o nome** (`findByGuestKey`), que impede duas pessoas de reivindicarem o
 *     mesmo convidado;
 *  3. **o aparelho** (`findByRespondent`), sinal residual, mantido como registro
 *     de auditoria depois que o login virou a identidade principal.
 */
export interface RsvpRepository {
  findByAccount(account: GuestAccount): Promise<Rsvp | null>;

  findByGuestKey(guestKey: GuestKey): Promise<Rsvp | null>;

  /**
   * Resposta já enviada por este respondente, se houver.
   *
   * "Este respondente" segue `RespondentIdentity.isSameRespondentAs`: mesmo
   * token **ou** (mesmo aparelho **e** mesma rede).
   */
  findByRespondent(identity: RespondentIdentity): Promise<Rsvp | null>;

  /**
   * Todas as respostas, da mais recente para a mais antiga.
   *
   * Sem paginação de propósito: o convite é de uma festa infantil com dezenas de
   * convidados, e a lista inteira cabe numa consulta. Se um dia não couber, o
   * lugar de resolver é aqui, não em quem chama.
   */
  listAll(): Promise<readonly Rsvp[]>;

  /** Creates or updates the aggregate as a whole. Must be atomic per guest. */
  save(rsvp: Rsvp): Promise<void>;
}
