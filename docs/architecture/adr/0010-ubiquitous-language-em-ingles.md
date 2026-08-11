# ADR-0010 — Ubiquitous Language em inglês no código

- **Status:** aceito
- **Data:** 2026-08-11
- **Decisores:** time do projeto (decisão explícita)

## Contexto

DDD prega que o código fale a linguagem dos especialistas de domínio. Aqui os
especialistas são os anfitriões: falam português, dizem "convidado", "vou / não
vou", "local da festa".

Uma leitura literal do livro levaria a `Convidado`, `Confirmacao`,
`decisao.vaiComparecer()`. Uma leitura pragmática nota que o resto do ecossistema
(React, Drizzle, Postgres, TypeScript) é inglês, e que código bilíngue produz
`ConvidadoRepository.findByChaveConvidado()`.

## Decisão

**Todo o código em inglês**, incluindo os nomes do domínio — decisão explícita do
time.

Para que isso não custe a linguagem ubíqua, três compromissos obrigatórios:

1. **Glossário oficial** em
   [`ubiquitous-language.md`](../ubiquitous-language.md), mapeando cada termo
   PT-BR ↔ código. É o contrato da tradução, e a tradução é 1-para-1: um termo do
   negócio, um tipo no código.
2. **Tudo que o convidado lê é em português** — mensagens de erro de domínio,
   textos do convite, comentários voltados aos anfitriões
   (`celebration.config.ts`). `InvalidGuestNameError` carrega
   _"O nome do convidado aceita apenas letras, espaços, hífen e apóstrofo."_
3. **Documentação e ADRs em português**, porque a audiência é o time e os
   anfitriões.

Sem sinônimo: se o negócio diz "confirmação", o código diz `Rsvp` — não
`Confirmation` em um arquivo e `Attendance` em outro.

## Consequências

**Boas:** consistência com bibliotecas e com o Postgres; sem identificadores
híbridos; `guest`, `rsvp`, `venue` e `honoree` são termos que qualquer dev
reconhece; onboarding técnico sem barreira de idioma.

**Ruins:**

- **existe uma tradução entre a conversa e o código.** O anfitrião diz "muda o
  local" e o dev vai em `Venue` — só funciona porque o glossário é mantido; se ele
  apodrecer, a linguagem ubíqua morre e este ADR passa a ser uma desculpa;
- `rsvp` é sigla inglesa (_répondez s'il vous plaît_) que os anfitriões não usam
  espontaneamente. É o termo mais estabelecido do domínio de eventos, mas exigiu
  entrada explícita no glossário;
- textos em português dentro de classes em inglês parecem estranhos na primeira
  leitura — é intencional e está documentado no item 2.

## Alternativas consideradas

| Alternativa                           | Por que não                                                                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Domínio em português, infra em inglês | Mais fiel ao DDD e foi a recomendação inicial, mas rejeitada pelo time; produziria `ConvidadoRepository` ao lado de `NeonRsvpRepository`. |
| Tudo em português, inclusive infra    | Máxima coerência interna, atrito máximo com o ecossistema (`pgTable('convidados')`, props de React em português).                         |
| Inglês sem glossário                  | O que este ADR existe para impedir: em três meses "guest" e "attendee" convivem e ninguém sabe se são a mesma coisa.                      |
