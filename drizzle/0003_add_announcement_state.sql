-- Guarda o que ja foi anunciado por e-mail, para o convite calar quando alguem
-- fica alternando entre "vou" e "nao vou".
--
-- Escrita a mao a partir do que o drizzle-kit gerou. O gerado era um
-- ADD COLUMN ... NOT NULL direto, que so funciona em tabela vazia: com uma
-- unica linha ja gravada, o Postgres recusa porque nao existe valor para ela.
-- Adicionar aceitando nulo, preencher e so entao travar e a sequencia que roda
-- tanto em banco vazio quanto em banco com convidados.
--
-- O preenchimento assume que toda resposta ja existente foi anunciada quando
-- foi gravada, que e verdade: ate agora todo evento virava e-mail na hora.

ALTER TABLE "rsvps" ADD COLUMN "announced_decision" "attendance_decision";--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "announced_at" timestamp with time zone;--> statement-breakpoint

UPDATE "rsvps"
   SET "announced_decision" = "decision",
       "announced_at" = "updated_at"
 WHERE "announced_decision" IS NULL;--> statement-breakpoint

ALTER TABLE "rsvps" ALTER COLUMN "announced_decision" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ALTER COLUMN "announced_at" SET NOT NULL;
