import { AggregateRoot } from '@/shared/kernel/aggregate-root';
import { RsvpConfirmed } from './events/rsvp-confirmed.event';
import { RsvpDeclined } from './events/rsvp-declined.event';
import { RsvpDecisionChanged } from './events/rsvp-decision-changed.event';
import type { AttendanceDecision } from './value-objects/attendance-decision';
import type { GuestKey } from './value-objects/guest-key';
import type { GuestAccount } from './value-objects/guest-account';
import type { GuestName } from './value-objects/guest-name';
import type { RespondentIdentity } from './value-objects/respondent-identity';
import type { RsvpId } from './value-objects/rsvp-id';

interface RsvpState {
  guestName: GuestName;
  account: GuestAccount;
  decision: AttendanceDecision;
  identity: RespondentIdentity;
  respondedAt: Date;
  updatedAt: Date;
  /** Última decisão que o convite chegou a anunciar. Ver `reconsider`. */
  announcedDecision: AttendanceDecision;
  announcedAt: Date;
}

/**
 * Silêncio entre dois anúncios da mesma resposta.
 *
 * Quinze minutos porque é o tempo de alguém abrir o convite, tocar em "eu vou",
 * pensar melhor, tocar em "não vou" e voltar atrás. Esse vaivém é uma pessoa
 * decidindo, não três notícias, e mandar três e-mails a respeito dele é o
 * caminho mais curto para o convite virar spam.
 */
const ANNOUNCEMENT_COOLDOWN_MS = 15 * 60 * 1000;

/**
 * Aggregate Root. One guest's answer to Ivy's invitation.
 *
 * Consistency boundary: a guest has exactly one answer at any time, e cada
 * resposta pertence a quem a criou. Answering again is not a new `Rsvp`; it is a
 * state transition on the existing one. Por isso o caso de uso procura o
 * agregado por chave de convidado **e** por identidade antes de decidir entre
 * criar, atualizar ou recusar.
 *
 * The aggregate never reads the clock or generates ids itself. Both arrive as
 * arguments, so its behaviour is fully deterministic and unit-testable.
 */
export class Rsvp extends AggregateRoot<RsvpId> {
  private state: RsvpState;

  private constructor(id: RsvpId, state: RsvpState) {
    super(id);
    this.state = state;
  }

  /** First answer from this guest. Raises `RsvpConfirmed` / `RsvpDeclined`. */
  static submit(input: {
    id: RsvpId;
    guestName: GuestName;
    account: GuestAccount;
    decision: AttendanceDecision;
    identity: RespondentIdentity;
    respondedAt: Date;
  }): Rsvp {
    const rsvp = new Rsvp(input.id, {
      guestName: input.guestName,
      account: input.account,
      decision: input.decision,
      identity: input.identity,
      respondedAt: input.respondedAt,
      updatedAt: input.respondedAt,
      // A primeira resposta sempre é notícia, seja "vou" ou "não vou".
      announcedDecision: input.decision,
      announcedAt: input.respondedAt,
    });

    rsvp.record(
      input.decision.isAttending()
        ? new RsvpConfirmed(input.id, input.guestName, input.account, input.respondedAt)
        : new RsvpDeclined(input.id, input.guestName, input.account, input.respondedAt),
    );

    return rsvp;
  }

  /**
   * Rebuilds an aggregate already stored by the repository.
   * Raises no events: replaying history is not new behaviour.
   */
  static rehydrate(input: {
    id: RsvpId;
    guestName: GuestName;
    account: GuestAccount;
    decision: AttendanceDecision;
    identity: RespondentIdentity;
    respondedAt: Date;
    updatedAt: Date;
    announcedDecision: AttendanceDecision;
    announcedAt: Date;
  }): Rsvp {
    return new Rsvp(input.id, {
      guestName: input.guestName,
      account: input.account,
      decision: input.decision,
      identity: input.identity,
      respondedAt: input.respondedAt,
      updatedAt: input.updatedAt,
      announcedDecision: input.announcedDecision,
      announcedAt: input.announcedAt,
    });
  }

  /**
   * The guest changed their mind. Idempotent: re-sending the same answer is a
   * no-op and raises no event, so a double tap on the button is harmless.
   *
   * The stored name is refreshed too ("maria clara" -> "Maria Clara"), because
   * the guest key is case- and accent-insensitive while the displayed name
   * should honour the latest spelling the guest chose.
   *
   * A identidade também é atualizada: a mesma pessoa volta com o cookie renovado
   * ou de outra rede, e o registro precisa passar a refletir os sinais mais
   * recentes. Sem isso, o acesso seguinte deixaria de reconhecê-la.
   *
   * ## Trocar de ideia não é o mesmo que ter notícia
   *
   * O estado muda a cada toque; o **anúncio** não. `RsvpDecisionChanged` só é
   * gravado quando as duas condições valem:
   *
   * 1. a decisão nova difere da última **anunciada**, não da última gravada. Sair
   *    de "vou" e voltar para "vou" devolve o mundo ao que já foi contado, e
   *    contar de novo seria contar nada;
   * 2. passou o silêncio de {@link ANNOUNCEMENT_COOLDOWN_MS} desde o último
   *    anúncio. Quem alterna está decidindo, e decidir em voz alta não é notícia.
   *
   * As duas decisões anunciam igual: "vou" e "não vou" valem a mesma coisa para
   * quem conta cabeça, e silenciar a recusa esconderia justamente o número que
   * mais dói errar.
   *
   * **Custo assumido:** uma troca feita dentro do silêncio e nunca revista não
   * gera e-mail nenhum. O estado fica correto no banco e na lista, e o próximo
   * relatório (de qualquer convidado) já sai com o número certo, então o buraco
   * se fecha sozinho a cada nova resposta. Fechá-lo na hora exigiria um
   * agendador, que é infraestrutura demais para dezenas de convidados.
   */
  reconsider(input: {
    guestName: GuestName;
    account: GuestAccount;
    decision: AttendanceDecision;
    identity: RespondentIdentity;
    changedAt: Date;
  }): void {
    const sameDecision = this.state.decision.equals(input.decision);
    const sameName = this.state.guestName.equals(input.guestName);
    const sameIdentity = this.state.identity.equals(input.identity);

    if (sameDecision && sameName && sameIdentity) return;

    const announcedDecision = this.state.announcedDecision;
    const isNews = !announcedDecision.equals(input.decision);
    const silencePassed =
      input.changedAt.getTime() - this.state.announcedAt.getTime() >= ANNOUNCEMENT_COOLDOWN_MS;
    const worthAnnouncing = isNews && silencePassed;

    this.state = {
      ...this.state,
      guestName: input.guestName,
      account: input.account,
      decision: input.decision,
      identity: input.identity,
      updatedAt: input.changedAt,
      ...(worthAnnouncing
        ? { announcedDecision: input.decision, announcedAt: input.changedAt }
        : {}),
    };

    if (worthAnnouncing) {
      this.record(
        new RsvpDecisionChanged(
          this.id,
          input.guestName,
          input.account,
          // O "antes" que interessa é o que a pessoa leu no último e-mail, não um
          // estado intermediário que ninguém chegou a ver.
          announcedDecision,
          input.decision,
          input.changedAt,
        ),
      );
    }
  }

  /** Conta verificada que criou esta resposta. Nunca muda de dono. */
  get account(): GuestAccount {
    return this.state.account;
  }

  get guestName(): GuestName {
    return this.state.guestName;
  }

  get guestKey(): GuestKey {
    return this.state.guestName.key();
  }

  get decision(): AttendanceDecision {
    return this.state.decision;
  }

  /** Sinais de quem criou. E mantém. Esta resposta. */
  get identity(): RespondentIdentity {
    return this.state.identity;
  }

  get respondedAt(): Date {
    return this.state.respondedAt;
  }

  get updatedAt(): Date {
    return this.state.updatedAt;
  }

  /** Última decisão que virou e-mail. O repositório precisa persistir isto. */
  get announcedDecision(): AttendanceDecision {
    return this.state.announcedDecision;
  }

  get announcedAt(): Date {
    return this.state.announcedAt;
  }

  isAttending(): boolean {
    return this.state.decision.isAttending();
  }
}
