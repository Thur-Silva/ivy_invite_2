import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AttendanceDecisionValue } from '../../../domain/value-objects/attendance-decision';

/**
 * Postgres enum mirroring the `AttendanceDecision` Value Object.
 * The database refuses any third value, so a bug in the app cannot corrupt the
 * guest list — the invariant is enforced twice, on purpose.
 */
export const attendanceDecisionEnum = pgEnum('attendance_decision', ['ATTENDING', 'NOT_ATTENDING']);

/**
 * Compile-time guard: adding a case to the domain Value Object without adding
 * it here (and generating a migration) breaks `npm run typecheck`.
 */
export type AttendanceDecisionEnumInSync =
  AttendanceDecisionValue extends (typeof attendanceDecisionEnum.enumValues)[number] ? true : never;

/**
 * Persistence shape of the `Rsvp` aggregate.
 *
 * `guest_key` is UNIQUE: it is the natural key that makes "answering again" an
 * update instead of a duplicate, and it lets `save()` be a single atomic
 * `INSERT ... ON CONFLICT` — which matters because the Neon HTTP driver has no
 * multi-statement transactions.
 */
/**
 * Persistence shape of the `Rsvp` aggregate.
 *
 * Os três digests de identidade têm restrição no banco, e não só na política de
 * domínio: duas submissões simultâneas do mesmo aparelho passariam pelas duas
 * leituras antes de qualquer escrita, e quem arbitra a corrida é o Postgres.
 *
 * As restrições espelham `RespondentIdentity.isSameRespondentAs`:
 *  - `UNIQUE(respondent_token)` cobre a primeira arma da regra;
 *  - `UNIQUE(respondent_device, respondent_network)` cobre a segunda.
 */
export const rsvpsTable = pgTable(
  'rsvps',
  {
    id: uuid('id').primaryKey(),
    guestKey: text('guest_key').notNull().unique(),
    guestName: text('guest_name').notNull(),
    decision: attendanceDecisionEnum('decision').notNull(),
    /** Digest do token do cookie assinado. */
    respondentToken: text('respondent_token').notNull().unique(),
    /** Digest de navegador + SO + idioma + resolução + fuso. */
    respondentDevice: text('respondent_device').notNull(),
    /** Digest do endereço de rede — nunca o IP cru. */
    respondentNetwork: text('respondent_network').notNull(),
    respondedAt: timestamp('responded_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('rsvps_respondent_device_network_idx').on(
      table.respondentDevice,
      table.respondentNetwork,
    ),
  ],
);

export type RsvpRow = typeof rsvpsTable.$inferSelect;
export type NewRsvpRow = typeof rsvpsTable.$inferInsert;
