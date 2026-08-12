-- Conta verificada por Google ou Facebook. Passa a ser a identidade do
-- convidado, e com ela a regra "uma resposta por convidado".
--
-- Escrita em passos, e não como o gerador cospe, para rodar também num banco que
-- já tenha respostas: "ADD COLUMN ... NOT NULL" sem default falha na primeira
-- linha existente.

CREATE TYPE "public"."account_provider" AS ENUM('GOOGLE', 'FACEBOOK');--> statement-breakpoint

-- 1. Sai a unicidade por aparelho.
--    Não é limpeza, é mudança de regra: com login, token e par aparelho+rede
--    deixam de identificar a pessoa. Mãe e pai que dividem o mesmo celular têm
--    contas distintas e direito a duas respostas, e as restrições antigas
--    reprovavam a segunda. Os digests continuam gravados para auditoria.
ALTER TABLE "rsvps" DROP CONSTRAINT IF EXISTS "rsvps_respondent_token_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "rsvps_respondent_device_network_idx";--> statement-breakpoint

-- 2. Colunas da conta, primeiro anuláveis.
ALTER TABLE "rsvps" ADD COLUMN "account_provider" "account_provider";--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "account_subject" text;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "account_email" text;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "account_name" text;--> statement-breakpoint

-- 3. Backfill de respostas anteriores ao login.
--    Cada linha antiga vira uma conta sintética distinta, derivada do id, para
--    que nenhuma delas colida com outra nem com uma conta real futura. Fica
--    marcada como legada e visível para os anfitriões conferirem.
UPDATE "rsvps" SET
  "account_provider" = 'GOOGLE',
  "account_subject"  = 'legacy:' || "id"::text,
  "account_email"    = 'legacy+' || "id"::text || '@convite.local',
  "account_name"     = "guest_name"
WHERE "account_subject" IS NULL;--> statement-breakpoint

-- 4. Agora sim, obrigatórias.
ALTER TABLE "rsvps" ALTER COLUMN "account_provider" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ALTER COLUMN "account_subject" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ALTER COLUMN "account_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ALTER COLUMN "account_name" SET NOT NULL;--> statement-breakpoint

-- 5. A única restrição de unicidade que sobra além do nome: a conta.
CREATE UNIQUE INDEX "rsvps_account_idx" ON "rsvps" USING btree ("account_provider","account_subject");--> statement-breakpoint
CREATE INDEX "rsvps_respondent_device_network_idx" ON "rsvps" USING btree ("respondent_device","respondent_network");
