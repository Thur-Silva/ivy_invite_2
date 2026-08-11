# ADR-0008 — Invariantes lançam exceção no domínio; `Result` na camada de aplicação

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

Duas escolas convivem em DDD para tratar violação de regra:

1. **Exceção** — `GuestName.create('')` lança. Construtor limpo, invariante
   sempre verdadeira, mas o fluxo de erro é invisível na assinatura.
2. **`Result<T, E>`** — `GuestName.create('')` devolve `Err`. Erro explícito no
   tipo, ao custo de `if (!result.ok) return result` em toda cadeia, ou de um
   objeto meio-construído se alguém esquecer de checar.

A decisão precisa valer para dois públicos diferentes: o código do domínio (onde
uma invariante quebrada é excepcional) e a borda da aplicação (onde "nome
inválido" é um resultado esperado que a UI precisa mostrar num campo).

## Decisão

Híbrido, com a fronteira exatamente na camada de aplicação.

### No domínio: guard clause + exceção

```ts
static create(raw: string): GuestName {
  if (collapsed.length === 0) throw InvalidGuestNameError.blank();
  // …
  return new GuestName(collapsed);
}
```

- construtores privados; toda criação passa por `static create`;
- todo erro de domínio herda de `DomainError` e carrega um `code` estável
  (`INVALID_GUEST_NAME`) mais mensagem em português voltada ao convidado;
- **é impossível existir em memória um Value Object inválido.**

### Na aplicação: `Result`, nunca exceção

```ts
async execute(command: SubmitRsvpCommand): Promise<Result<SubmitRsvpOutcome, SubmitRsvpFailure>>
```

- `SubmitRsvp.parse()` converte `DomainError` em
  `{ kind: 'VALIDATION', code, message, field }`;
- **erro que não é `DomainError` é rethrown**: defeito não vira resultado de
  negócio. O `catch` externo o registra e devolve `RSVP_STORAGE_UNAVAILABLE`;
- o caso de uso **nunca lança**, e há um teste que prova isso com repositório
  fora do ar.

### Consequência para a Presentation

A Server Action faz um `switch` no `Result` e produz `RsvpFormState`. O
componente não tem `try/catch` e não pode esquecer de tratar falha — o tipo não
compila sem isso.

## Consequências

**Boas:** invariante garantida por construção; a assinatura pública do caso de
uso documenta tudo que pode dar errado; erro de negócio (o convidado pode
consertar) fica separado de falha técnica (só resta tentar de novo); a Presentation
não decide nada sobre erro.

**Ruins:**

- **duas convenções no mesmo repositório** — precisa deste ADR para não parecer
  incoerência;
- `parse()` usa `try/catch` internamente para traduzir, o que é feio embora
  contido em um método privado de 6 linhas;
- se alguém chamar `GuestName.create` direto de um componente, a exceção sobe até
  o error boundary. O ESLint não bloqueia isso hoje — vale um teste de
  arquitetura se acontecer.

## Alternativas consideradas

| Alternativa                                 | Por que não                                                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `Result` também no domínio                  | Mais puro, mas encadear 4 VOs vira `flatMap`/`andThen` aninhado, ou um `Rsvp` construído a partir de valores não validados. |
| Exceção também na aplicação                 | Mais curto, mas obriga a Presentation a saber quais exceções existem — nada no tipo indica isso.                            |
| `zod` validando também as regras de negócio | Colocaria regra de domínio numa lib de schema, criando segunda fonte de verdade fora do domínio.                            |
