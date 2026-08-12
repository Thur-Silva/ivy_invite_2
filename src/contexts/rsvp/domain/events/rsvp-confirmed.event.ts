import type { DomainEvent } from '@/shared/kernel/domain-event';
import type { GuestAccount } from '../value-objects/guest-account';
import type { GuestName } from '../value-objects/guest-name';
import type { RsvpId } from '../value-objects/rsvp-id';

/**
 * A guest answered "vou" for the first time.
 *
 * Carrega a conta, e não só o nome, porque quem assina o evento precisa saber
 * **para quem escrever**. Um assinante que tivesse de voltar ao repositório para
 * descobrir o e-mail transformaria "reagir a um fato" em "consultar estado", que
 * é justamente o que evento de domínio existe para evitar.
 */
export class RsvpConfirmed implements DomainEvent {
  readonly name = 'RsvpConfirmed' as const;

  constructor(
    private readonly rsvpId: RsvpId,
    private readonly guestName: GuestName,
    private readonly account: GuestAccount,
    readonly occurredAt: Date,
  ) {}

  get aggregateId(): string {
    return this.rsvpId.value;
  }

  get guestEmail(): string {
    return this.account.email;
  }

  get guestFirstName(): string {
    return this.guestName.firstName();
  }

  get guestFullName(): string {
    return this.guestName.value;
  }

  payload(): Readonly<Record<string, unknown>> {
    return {
      rsvpId: this.rsvpId.value,
      guestName: this.guestName.value,
      guestEmail: this.account.email,
      accountProvider: this.account.provider,
    };
  }
}
