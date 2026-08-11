# ADR-0004 — Server Actions como adapter de entrada (sem REST)

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

O sistema tem **um** comando (`SubmitRsvp`) e **uma** consulta
(`GetCelebrationDetails`, que roda no servidor durante o build). O cliente é uma
única página mobile.

Na arquitetura hexagonal, precisamos de um _driving adapter_: algo que receba a
intenção do usuário e chame o caso de uso. As opções são um Route Handler REST
(`POST /api/rsvp`) consumido por `fetch`, ou uma Server Action.

Requisito não funcional relevante: o convite vai por WhatsApp para famílias com
celulares variados e conexão instável. **Funcionar sem JavaScript é desejável**,
não acadêmico.

## Decisão

Usar **Server Actions** como adapter de entrada, em
`src/contexts/rsvp/presentation/actions/submit-rsvp.action.ts`, e **não** criar
API REST.

Regras que a Action obedece:

1. Só traduz: `FormData` → Command → `Result` → estado de view. Nenhum `if` de
   negócio, nenhum SQL.
2. Valida **formato** com Zod (`rsvpFormSchema`). Regra de negócio é do domínio.
3. Nunca deixa exceção escapar: o caso de uso devolve `Result`
   ([ADR-0008](./0008-invariantes-lancam-result-na-aplicacao.md)).
4. O formulário é um `<form action={...}>` real com `<input type="radio">`
   nativos — sem `preventDefault`, sem gate de validação no cliente.

## Consequências

**Boas:**

- **progressive enhancement de graça**: sem JS, o navegador faz POST nativo, o
  RSVP é gravado e a página responde; com JS, a mesma submissão anima no lugar
  via `useActionState`;
- um round-trip: a resposta traz UI e dados juntos;
- sem contrato HTTP para versionar, sem `fetch` para tratar, sem serialização
  manual;
- tipagem ponta a ponta entre o formulário e a Action.

**Ruins:**

- **acoplamento ao Next.js na borda.** Trocar de framework significa reescrever
  este adapter — aceito, porque é exatamente o papel de um adapter, e ele tem
  ~50 linhas sem lógica;
- Server Actions são endpoints POST acessíveis diretamente. Sem autenticação (o
  RSVP é público por natureza), o risco residual é flood — registrado como
  PBI-11;
- sem API pública, um app nativo futuro precisaria de um Route Handler novo. Não
  há app nativo no horizonte.

## Alternativas consideradas

| Alternativa                              | Por que não                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/rsvp` + `fetch` no cliente    | Quebra sem JS, exige tratar rede/JSON/erro à mão e cria um contrato para manter — sem nenhum consumidor externo que justifique. |
| tRPC                                     | Tipagem ponta a ponta que Server Actions já dão nativamente, com uma dependência a mais.                                        |
| Serviço de formulário (Formspree, Tally) | Zero código, mas nenhum domínio, nenhuma idempotência e nenhum controle sobre a experiência — contraria o objetivo do projeto.  |
