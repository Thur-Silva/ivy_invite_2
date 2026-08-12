# ADR-0002. Arquitetura hexagonal + DDD dentro do Next.js App Router

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

O requisito explícito é seguir DDD à risca. O framework escolhido (Next.js 16,
App Router) empurra na direção oposta: os tutoriais colocam SQL dentro do
componente de página, e o roteamento por sistema de arquivos sugere organizar o
código por _rota_, não por _domínio_.

Se `src/app/` for a estrutura do projeto, o domínio deixa de existir: regras
ficam espalhadas por componentes, e testar "um convidado não pode responder
duas vezes" exige renderizar React.

## Decisão

Tratar o Next.js como **detalhe de entrega**, não como arquitetura.

1. **Organizar por Bounded Context, depois por camada:**
   `src/contexts/<contexto>/{domain,application,infrastructure,presentation}`.
2. **`src/app/` só compõe.** Nenhuma regra, nenhum acesso a dados: importa Use
   Cases via Composition Root e monta seções.
3. **Regra da Dependência apontando para dentro**, com o domínio sem nenhuma
   dependência externa (nem React, nem Zod, nem Drizzle).
4. **Portas no domínio** para conceitos de domínio (`RsvpRepository`), portas na
   aplicação para conceitos técnicos (`Clock`, `IdGenerator`, `EventPublisher`).
5. **Um Composition Root por contexto**, em `infrastructure/composition-root.ts`
   , o único lugar onde `new AlgumaCoisaConcreta()` acontece.
6. **A Regra da Dependência é validada pelo ESLint** (`no-restricted-imports`
   por zona, em `eslint.config.mjs`), não pela boa vontade de quem revisa.

## Consequências

**Boas:**

- 32 testes de regra rodam em <1s sem banco, servidor ou navegador;
- trocar Neon por outro banco toca 2 arquivos (`neon-rsvp.repository.ts` e o
  Composition Root);
- o convite pode ser redesenhado inteiro sem abrir a pasta `domain/`;
- violar a camada é erro de CI, não assunto de code review.

**Ruins:**

- mais arquivos e mais indireção do que o problema exige. Para gravar duas
  colunas há um agregado, um mapper, um repositório e um caso de uso;
- um dev acostumado ao Next.js "padrão" precisa do mapa em
  [`README.md`](../README.md#33-mapa-de-diretórios) para se localizar;
- Server Components e Server Actions moram em `presentation/` de cada contexto,
  o que é incomum e exige a explicação deste ADR.

Aceito: o custo é fixo e pequeno; o benefício (regra testável e isolada) é o
objetivo declarado do projeto.

## Alternativas consideradas

| Alternativa                                                        | Por que não                                                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Next.js idiomático (SQL no componente, `lib/` genérica)            | Mais rápido de escrever, mas sem camada de domínio testável. Contraria o requisito.                                  |
| Camadas na raiz (`src/domain`, `src/application`, …) sem contextos | Funciona com um contexto; com dois, `domain/` mistura RSVP e Celebration e a fronteira desaparece.                   |
| Monorepo com pacote `@ivy/domain` separado                         | Isolamento mais forte, mas adiciona workspaces, build encadeado e complexidade de deploy para um site de uma página. |
| Backend separado (NestJS) + front Next.js                          | Isolamento máximo, custo de infraestrutura e latência que um convite de festa não justifica.                         |
