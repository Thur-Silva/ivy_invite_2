import 'server-only';
import { neon } from '@neondatabase/serverless';
import { and, desc, eq, or } from 'drizzle-orm';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { Rsvp } from '../../domain/rsvp.aggregate';
import type { RsvpRepository } from '../../domain/rsvp.repository';
import type { GuestAccount } from '../../domain/value-objects/guest-account';
import type { GuestKey } from '../../domain/value-objects/guest-key';
import type { RespondentIdentity } from '../../domain/value-objects/respondent-identity';
import { rsvpsTable } from './drizzle/rsvp.schema';
import { RsvpMapper } from './rsvp.mapper';

/**
 * Driven adapter. `RsvpRepository` backed by Neon serverless Postgres.
 *
 * Uses the HTTP driver (`neon-http`): one round trip per statement, no
 * connection pool to exhaust, which is the right fit for Vercel functions that
 * handle a handful of RSVPs. See ADR-0003.
 */
export class NeonRsvpRepository implements RsvpRepository {
  private readonly db: NeonHttpDatabase<Record<string, never>>;

  constructor(connectionString: string) {
    this.db = drizzle(neon(connectionString));
  }

  /** Identidade forte: o par provedor + subject é único no banco. */
  async findByAccount(account: GuestAccount): Promise<Rsvp | null> {
    const rows = await this.db
      .select()
      .from(rsvpsTable)
      .where(
        and(
          eq(rsvpsTable.accountProvider, account.provider),
          eq(rsvpsTable.accountSubject, account.subject),
        ),
      )
      .limit(1);

    const row = rows.at(0);
    return row === undefined ? null : RsvpMapper.toDomain(row);
  }

  async findByGuestKey(guestKey: GuestKey): Promise<Rsvp | null> {
    const rows = await this.db
      .select()
      .from(rsvpsTable)
      .where(eq(rsvpsTable.guestKey, guestKey.value))
      .limit(1);

    const row = rows.at(0);
    return row === undefined ? null : RsvpMapper.toDomain(row);
  }

  /**
   * Tradução em SQL de `RespondentIdentity.isSameRespondentAs`:
   *
   *     mesmo token  OU  (mesmo aparelho E mesma rede)
   *
   * A regra canônica vive no Value Object. **Se ela mudar lá, muda aqui**. A
   * duplicação é o preço de deixar o banco filtrar em vez de carregar a tabela
   * inteira para a memória, e está anotada nos dois lados.
   */
  async findByRespondent(identity: RespondentIdentity): Promise<Rsvp | null> {
    const rows = await this.db
      .select()
      .from(rsvpsTable)
      .where(
        or(
          eq(rsvpsTable.respondentToken, identity.token),
          and(
            eq(rsvpsTable.respondentDevice, identity.device),
            eq(rsvpsTable.respondentNetwork, identity.network),
          ),
        ),
      )
      .limit(1);

    const row = rows.at(0);
    return row === undefined ? null : RsvpMapper.toDomain(row);
  }

  /**
   * Lista inteira, ordenada pelo banco.
   *
   * `ORDER BY` no Postgres e não em JavaScript: o índice já existe e ordenar
   * dezenas de linhas no servidor de banco é mais barato que trazer tudo fora de
   * ordem para reordenar em memória.
   */
  async listAll(): Promise<readonly Rsvp[]> {
    const rows = await this.db.select().from(rsvpsTable).orderBy(desc(rsvpsTable.updatedAt));
    return rows.map((row) => RsvpMapper.toDomain(row));
  }

  /**
   * Upsert atômico com a **conta** como alvo do conflito.
   *
   * Já foi `guest_key`, e estava errado: quando a pessoa corrigia o nome que
   * veio preenchido, a chave mudava, o `ON CONFLICT` não casava com nada e o
   * `INSERT` criava uma segunda linha para a mesma conta. A conta é a única
   * identidade que não muda entre duas respostas da mesma pessoa, então é ela
   * que tem de ser o alvo. `guest_key` entra no `SET`, porque é justamente o
   * campo que pode mudar.
   *
   * `id` e `responded_at` ficam fora do `SET` de propósito: a identidade do
   * agregado e o momento da primeira resposta não mudam quando alguém muda de
   * ideia.
   */
  async save(rsvp: Rsvp): Promise<void> {
    const row = RsvpMapper.toRow(rsvp);

    await this.db
      .insert(rsvpsTable)
      .values(row)
      .onConflictDoUpdate({
        target: [rsvpsTable.accountProvider, rsvpsTable.accountSubject],
        set: {
          guestKey: row.guestKey,
          guestName: row.guestName,
          decision: row.decision,
          // O provedor pode ter atualizado nome ou e-mail desde a última vez.
          accountEmail: row.accountEmail,
          accountName: row.accountName,
          // A identidade de aparelho é atualizada junto: a mesma pessoa pode
          // voltar com cookie renovado ou de outra rede, e o registro deve
          // refletir os sinais atuais.
          respondentToken: row.respondentToken,
          respondentDevice: row.respondentDevice,
          respondentNetwork: row.respondentNetwork,
          updatedAt: row.updatedAt,
          // Sem estes dois no SET, o silêncio entre anúncios nunca avançaria e
          // toda troca voltaria a virar e-mail.
          announcedDecision: row.announcedDecision,
          announcedAt: row.announcedAt,
        },
      });
  }
}
