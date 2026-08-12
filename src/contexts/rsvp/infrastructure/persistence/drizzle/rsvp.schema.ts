import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AttendanceDecisionValue } from '../../../domain/value-objects/attendance-decision';
import type { AccountProviderValue } from '../../../domain/value-objects/guest-account';

/**
 * Postgres enum mirroring the `AttendanceDecision` Value Object.
 * The database refuses any third value, so a bug in the app cannot corrupt the
 * guest list. A invariante é garantida duas vezes, de propósito.
 */
export const attendanceDecisionEnum = pgEnum('attendance_decision', ['ATTENDING', 'NOT_ATTENDING']);

/**
 * Provedores aceitos pelo banco.
 *
 * Mais permissivo que o domínio de propósito. Hoje `ACCOUNT_PROVIDERS` tem só
 * `GOOGLE`, mas `FACEBOOK` continua aqui porque remover valor de enum no
 * Postgres exige recriar o tipo e reescrever a coluna, e um valor que nunca é
 * gravado não custa nada. Quem manda é o Value Object; isto é rede de proteção.
 */
export const accountProviderEnum = pgEnum('account_provider', ['GOOGLE', 'FACEBOOK']);

/**
 * Compile-time guards: adicionar um caso no Value Object sem adicionar aqui
 * (e gerar migração) quebra `npm run typecheck`.
 */
export type AttendanceDecisionEnumInSync =
  AttendanceDecisionValue extends (typeof attendanceDecisionEnum.enumValues)[number] ? true : never;

export type AccountProviderEnumInSync =
  AccountProviderValue extends (typeof accountProviderEnum.enumValues)[number] ? true : never;

/**
 * Persistence shape of the `Rsvp` aggregate.
 *
 * ## Uma restrição de unicidade, não três
 *
 * Desde que responder exige login, quem carrega a regra "uma resposta por
 * convidado" é `UNIQUE(account_provider, account_subject)`. Só isso.
 *
 * As restrições únicas de aparelho e de token foram **removidas de propósito**,
 * não esquecidas. Elas eram a defesa possível enquanto a identidade era um nome
 * digitado; com login, passaram a reprovar gente honesta: mãe e pai que dividem
 * o mesmo celular compartilham token, aparelho e rede, e são duas pessoas com
 * direito a duas respostas. Os digests continuam gravados como registro de
 * auditoria, e o índice não único acelera consultas futuras.
 *
 * `guest_key` segue único: impede que uma conta sobrescreva a resposta de outra
 * digitando o mesmo nome.
 */
export const rsvpsTable = pgTable(
  'rsvps',
  {
    id: uuid('id').primaryKey(),
    guestKey: text('guest_key').notNull().unique(),
    guestName: text('guest_name').notNull(),
    decision: attendanceDecisionEnum('decision').notNull(),

    /*
     * Conta verificada pelo Google.
     *
     * Guardamos o `subject` e não só o e-mail porque e-mail muda: a pessoa troca
     * de provedor, corrige um alias, migra a conta. O `subject` é o id interno
     * do provedor e não muda nunca.
     */
    accountProvider: accountProviderEnum('account_provider').notNull(),
    accountSubject: text('account_subject').notNull(),
    accountEmail: text('account_email').notNull(),
    accountName: text('account_name').notNull(),

    /* Sinais de aparelho: auditoria, já não recusam ninguém. */
    respondentToken: text('respondent_token').notNull(),
    respondentDevice: text('respondent_device').notNull(),
    respondentNetwork: text('respondent_network').notNull(),

    respondedAt: timestamp('responded_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('rsvps_account_idx').on(table.accountProvider, table.accountSubject),
    index('rsvps_respondent_device_network_idx').on(
      table.respondentDevice,
      table.respondentNetwork,
    ),
  ],
);

export type RsvpRow = typeof rsvpsTable.$inferSelect;
export type NewRsvpRow = typeof rsvpsTable.$inferInsert;
