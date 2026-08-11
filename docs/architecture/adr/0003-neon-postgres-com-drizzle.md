# ADR-0003 — Neon Postgres com Drizzle (driver HTTP)

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

As confirmações precisam sobreviver a reinício de servidor — é o único dado que
o site produz e perdê-lo significa não saber quantas pessoas vêm à festa.

O deploy é na Vercel ([ADR-0004](./0004-server-actions-como-adapter-de-entrada.md)),
em funções serverless: cada requisição pode cair numa instância nova, e um pool
de conexões TCP tradicional esgota o limite do Postgres rapidamente. O volume
esperado é ridículo (dezenas de linhas, dezenas de escritas no total).

## Decisão

**Neon** (Postgres serverless) como banco, acessado por **Drizzle ORM** através
do driver **HTTP** (`drizzle-orm/neon-http`).

- Uma tabela: `rsvps`, com `UNIQUE(guest_key)` e enum Postgres
  `attendance_decision`.
- Migrações versionadas em `drizzle/`, geradas por `drizzle-kit generate` e
  aplicadas por `drizzle-kit migrate`.
- O schema Drizzle mora em `infrastructure/persistence/drizzle/` **de cada
  contexto**; `drizzle.config.ts` usa glob para descobri-los, então criar um
  contexto novo com tabelas não exige editar configuração.
- `RsvpMapper` traduz linha ↔ agregado. Nenhum tipo do Drizzle aparece em
  `domain/`.
- Sem `DATABASE_URL`, o Composition Root cai para `InMemoryRsvpRepository` em
  desenvolvimento e **falha ao subir** em produção.

## Consequências

**Boas:**

- `npm run dev` funciona em clone limpo, sem provisionar nada;
- sem pool para esgotar: cada statement é uma requisição HTTP;
- free tier cobre este projeto com folga;
- SQL gerado é visível e revisável nas migrações;
- o enum no banco repete a invariante `AttendanceDecision` — um bug de aplicação
  não corrompe a lista de convidados.

**Ruins:**

- **o driver HTTP não tem transação multi-statement.** Hoje é irrelevante
  (`save` é um único `INSERT … ON CONFLICT`), mas o primeiro caso de uso que
  precisar de duas escritas atômicas exige trocar para o driver WebSocket;
- cold start do Neon (~500ms) no primeiro acesso após inatividade;
- `InMemoryRsvpRepository` em dev pode esconder um bug que só aparece com SQL
  real — mitigado pelo PBI-05, que adiciona teste de integração.

## Alternativas consideradas

| Alternativa                             | Por que não                                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Google Sheets como banco                | Familiar para os anfitriões, mas frágil, lento e sem restrição de unicidade — a idempotência do RSVP viraria código. |
| Vercel Postgres / Supabase              | Equivalentes; Neon foi escolha explícita do time.                                                                    |
| Prisma                                  | Cliente maior, geração de código no build e menos previsível em serverless que Drizzle.                              |
| SQL puro com `@neondatabase/serverless` | Elimina o ORM, mas perde tipagem do schema e migrações versionadas.                                                  |
| Só WhatsApp (sem banco)                 | Zero infraestrutura, mas nenhuma lista consolidada — o anfitrião teria que contar mensagens à mão.                   |
