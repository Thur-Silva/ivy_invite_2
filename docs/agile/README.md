# Processo Agile

Scrum enxuto, dimensionado para um time pequeno e um prazo fixo e inegociável
(a festa não muda de data por causa de um bug).

## Documentos

| Documento                                       | Para quê                                                       |
| ----------------------------------------------- | -------------------------------------------------------------- |
| [Visão de Produto](./product-vision.md)         | elevator pitch, Product Goal, métricas, riscos, fora de escopo |
| [Personas](./personas.md)                       | os três comportamentos que mudam decisões de código            |
| [User Story Map](./user-story-map.md)           | jornada do convidado e cortes de release                       |
| [Product Backlog](./product-backlog.md)         | histórias com Gherkin, pontos e MoSCoW                         |
| [Definition of Ready](./definition-of-ready.md) | quando uma história pode entrar em sprint                      |
| [Definition of Done](./definition-of-done.md)   | quando uma história pode ir ao convidado                       |
| [Sprint 1](./sprint-01.md)                      | goal, backlog, incremento, review e retro                      |

## Cadência

Sprints de **1 semana**. O prazo total até a festa é de ~4 semanas, então
sprints de duas semanas dariam apenas dois pontos de correção de rota. Uma
semana dá quatro.

| Cerimônia   | Quando               | Duração | Saída                                                  |
| ----------- | -------------------- | ------- | ------------------------------------------------------ |
| Planning    | segunda, manhã       | 45 min  | Sprint Goal + Sprint Backlog                           |
| Daily       | todo dia             | 10 min  | impedimento identificado no mesmo dia                  |
| Refinamento | quarta               | 30 min  | histórias atendendo ao [DoR](./definition-of-ready.md) |
| Review      | sexta                | 30 min  | incremento demonstrado **no celular**, com a PO        |
| Retro       | sexta, após a review | 20 min  | no máximo 4 ações, com responsável                     |

## Papéis

| Papel         | Quem                | Responsabilidade                                         |
| ------------- | ------------------- | -------------------------------------------------------- |
| Product Owner | Marina (mãe da Ivy) | ordena o backlog, aceita o incremento, decide escopo     |
| Dev Team      | time técnico        | como construir, estimativas, qualidade técnica           |
| Scrum Master  | o próprio time      | facilita as cerimônias; sem papel dedicado neste tamanho |

## Regras que o time se impôs

1. **O Sprint Goal é uma frase, não uma lista.** Se precisar de "e" para
   descrever o objetivo, a sprint tem dois objetivos e nenhum será alcançado.
2. **Escopo não cresce dentro da sprint.** Ideia boa no meio da semana vai para o
   backlog, não para o Sprint Backlog. O Sprint 1 rejeitou duas assim (PBI-05 e
   PBI-07) e fechou no compromisso.
3. **Uma história não é "quase pronta".** Ou atende ao DoD, ou volta ao backlog
   com os pontos não contados.
4. **Todo débito assumido é dito na Review**, nunca omitido. Ver a
   [nota de honestidade do DoD](./definition-of-done.md#nota-sobre-honestidade-do-dod).
5. **Decisão técnica que restringe o futuro vira ADR** antes de virar código.
6. **A Review acontece num celular real**, não no navegador do desenvolvedor. O
   produto é mobile; demonstrar no desktop é demonstrar outro produto.

## Estimativa

Story points em Fibonacci (1, 2, 3, 5, 8, 13), Planning Poker.

- **1 a 3 pts**: sei exatamente como fazer, é escrever
- **5 pts**: sei o caminho, tem detalhe a resolver
- **8 pts**: tem decisão de desenho a tomar
- **13 pts**: grande demais. Quebrar ou virar spike

Regra: **13 nunca entra em sprint**. Se o time estima 13, a história não passou no
DoR (item _Small_).
