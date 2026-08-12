import type { RsvpRepository } from '../../domain/rsvp.repository';

/** Uma linha da lista de respostas. Serializável de propósito. */
export interface GuestRosterEntry {
  readonly name: string;
  readonly attending: boolean;
  readonly respondedAtIso: string;
}

/** Retrato da lista inteira, com os totais já calculados. */
export interface GuestRoster {
  /** Da resposta mais recente para a mais antiga. */
  readonly entries: readonly GuestRosterEntry[];
  readonly attendingCount: number;
  readonly notAttendingCount: number;
  readonly total: number;
  /** Percentual de confirmados, arredondado. Alimenta o gráfico do relatório. */
  readonly attendingPercent: number;
}

/**
 * Use Case (query). "me dê a lista de respostas".
 *
 * Query, então devolve read model em vez de `Result`: não há regra a violar nem
 * estado a mudar, e uma falha aqui é infraestrutura, que sobe para quem chamou.
 *
 * Nasceu para o relatório que o admin recebe a cada confirmação, e é a mesma
 * consulta que o painel do anfitrião (PBI-05) vai usar. Somar aqui, e não no
 * template do e-mail, é o que evita duas contagens divergindo quando o painel
 * chegar.
 */
export class GetGuestRoster {
  constructor(private readonly deps: { readonly rsvps: RsvpRepository }) {}

  async execute(): Promise<GuestRoster> {
    const stored = await this.deps.rsvps.listAll();

    const entries: GuestRosterEntry[] = stored.map((rsvp) => ({
      name: rsvp.guestName.value,
      attending: rsvp.isAttending(),
      respondedAtIso: rsvp.updatedAt.toISOString(),
    }));

    const attendingCount = entries.filter((entry) => entry.attending).length;
    const total = entries.length;

    return {
      entries,
      attendingCount,
      notAttendingCount: total - attendingCount,
      total,
      // Zero respostas é 0%, não NaN: o gráfico precisa de um número sempre.
      attendingPercent: total === 0 ? 0 : Math.round((attendingCount / total) * 100),
    };
  }
}
