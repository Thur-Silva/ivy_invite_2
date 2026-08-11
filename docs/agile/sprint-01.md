# Sprint 1 — "Convite no ar"

- **Período:** 2026-08-11 → 2026-08-15
- **Data da festa:** 2026-09-12 _(`[PLACEHOLDER]` — a confirmar)_
- **Sprints restantes até a festa:** 3

## Sprint Goal

> Um convidado consegue abrir o convite no celular, entender a festa, confirmar
> presença e abrir a rota até o local — em cima de uma arquitetura em que regra
> de negócio é testável sem banco e sem navegador.

Objetivo único e verificável: se um familiar conseguir fazer isso de ponta a
ponta no próprio celular, a sprint teve sucesso.

## Sprint Backlog

| ID     | História                           |    Pts | Status           |
| ------ | ---------------------------------- | -----: | ---------------- |
| PBI-00 | Fundação arquitetural (enabler)    |      8 | ✅               |
| PBI-02 | Confirmar presença (vou / não vou) |      8 | ✅               |
| PBI-01 | Ver o convite (intro, tema, data)  |      5 | ✅               |
| PBI-03 | Saber onde é e como chegar         |      5 | ✅               |
| PBI-04 | Mudar de ideia                     |      3 | ✅               |
|        | **Total**                          | **29** | **29 entregues** |

Ordem de execução deliberada: **PBI-00 primeiro** como _walking skeleton_
(formulário → Server Action → caso de uso → agregado → Postgres), depois PBI-02,
que é o coração do produto. As duas histórias de leitura vieram por último — se a
sprint estourasse, o que sobraria inacabado seria enfeite, não função.

## Incremento entregue

**Arquitetura**

- 2 Bounded Contexts (`rsvp` core, `celebration` supporting), sem import cruzado
- 4 camadas com Regra da Dependência **verificada pelo ESLint**
- Shared Kernel: `Entity`, `AggregateRoot`, `ValueObject`, `Identifier`,
  `DomainEvent`, `DomainError`, `Result`
- 8 Value Objects, 2 Aggregate Roots, 3 Domain Events, 2 portas de repositório,
  3 portas técnicas
- 1 Composition Root por contexto
- **10 ADRs**

**Produto**

- Convite de página única, mobile-first, em quatro atos
- Lago encantado em WebGL (R3F + GLSL) com degradação em 3 níveis
- Formulário RSVP com progressive enhancement (funciona sem JS), selo real,
  confete e "mudar minha resposta"
- Endereço, prévia de mapa e deep links Google Maps + Waze, sem API key
- Neon Postgres com migração versionada e upsert idempotente

**Qualidade**

- 32 testes, **876ms**, sem banco/servidor/navegador
- `npm run verify` (typecheck + lint + test) verde
- `npm run build` limpo; página gerada como estática

## Métricas

| Métrica                          | Valor                            |
| -------------------------------- | -------------------------------- |
| Pontos comprometidos / entregues | 29 / 29                          |
| Testes                           | 32 ✅                            |
| Duração da suíte                 | 0,88s                            |
| Erros de tipo                    | 0                                |
| Erros de lint                    | 0                                |
| Rotas                            | 1 estática (`/`) + Server Action |

## Sprint Review

**Demonstrado:** jornada completa do convidado no celular, incluindo os cenários
de erro (nome inválido, opção não escolhida, banco fora do ar) e a idempotência
(enviar duas vezes → uma linha).

**Aceite da PO:** ⏳ pendente — depende dos dados reais da festa.

**Bloqueio para publicar:** `celebration.config.ts` tem data, endereço e
coordenadas `[PLACEHOLDER]`. É o único item entre o estado atual e o convite no
ar. Registrado como risco **R1** na [visão](./product-vision.md).

## Sprint Retrospective

### O que funcionou

- **Walking skeleton primeiro.** Com o caminho completo aberto no PBI-00, as
  outras quatro histórias foram preenchimento, sem retrabalho de integração.
- **Regra da Dependência no linter.** Deixou de ser assunto de revisão de código.
  A tentação de importar Drizzle no domínio para "ir mais rápido" simplesmente
  não compila.
- **Portas desde o início.** O caso de uso `SubmitRsvp` foi escrito e testado
  antes de existir qualquer tabela — inclusive o cenário de banco fora do ar.
- **Escopo respeitado.** Acompanhantes (PBI-07) e painel (PBI-05) foram
  reconhecidos como valiosos e **não** puxados. Sprint fechou no compromisso.

### O que atrapalhou

- **Regras novas do `react-hooks` v6** (React Compiler) rejeitaram três padrões
  comuns: `setState` em efeito e mutação de valor memoizado. Custou uma refação
  para `useSyncExternalStore` e refs — resultado ficou melhor, mas foi custo não
  previsto.
- **GLSL não tem rede de segurança.** Nenhum teste cobre o shader; quebra visual
  só aparece olhando. Risco aceito, mas real.
- **`InMemoryRsvpRepository` em dev** pode esconder divergência de comportamento
  com o Postgres. Foi o gatilho para criar o PBI-14.

### Ações para o Sprint 2

| #   | Ação                                                             | Responsável |
| --- | ---------------------------------------------------------------- | ----------- |
| 1   | Cobrar dados reais da festa dos anfitriões **antes** do planning | time        |
| 2   | Puxar PBI-14 (integração Neon) junto com PBI-05, na mesma sprint | time        |
| 3   | Registrar decisão de a11y do painel no DoR antes de estimar      | time        |
| 4   | Testar em device físico **durante** a história, não no fim       | time        |
