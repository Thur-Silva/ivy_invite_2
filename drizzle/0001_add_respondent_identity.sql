-- Identidade de quem responde: token de sessão, assinatura do aparelho e rede.
-- Os três chegam como digest SHA-256; nenhum valor cru é persistido.
--
-- Escrita em quatro passos em vez de "ADD COLUMN ... NOT NULL" direto: assim a
-- migration também roda num banco que já tenha respostas gravadas, em vez de
-- falhar na primeira linha existente.

-- 1. colunas anuláveis
ALTER TABLE "rsvps" ADD COLUMN "respondent_token" text;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "respondent_device" text;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "respondent_network" text;--> statement-breakpoint

-- 2. backfill de respostas anteriores ao limite por aparelho.
--    Deriva um digest único por linha a partir do id, então cada registro
--    antigo conta como um respondente distinto e nenhum deles bloqueia outro.
UPDATE "rsvps" SET
  "respondent_token"   = encode(sha256(("id"::text || ':legacy:token')::bytea), 'hex'),
  "respondent_device"  = encode(sha256(("id"::text || ':legacy:device')::bytea), 'hex'),
  "respondent_network" = encode(sha256(("id"::text || ':legacy:network')::bytea), 'hex')
WHERE "respondent_token" IS NULL;--> statement-breakpoint

-- 3. agora sim, obrigatórias
ALTER TABLE "rsvps" ALTER COLUMN "respondent_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ALTER COLUMN "respondent_device" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ALTER COLUMN "respondent_network" SET NOT NULL;--> statement-breakpoint

-- 4. as duas restrições que espelham RespondentIdentity.isSameRespondentAs:
--    mesmo token OU (mesmo aparelho E mesma rede)
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_respondent_token_unique" UNIQUE("respondent_token");--> statement-breakpoint
CREATE UNIQUE INDEX "rsvps_respondent_device_network_idx" ON "rsvps" USING btree ("respondent_device","respondent_network");
