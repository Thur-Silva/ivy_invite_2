# ADR-0009. `guest_key` como chave natural do convidado

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

O formulário pede **só o nome**. Sem e-mail, sem telefone, sem login. Foi uma
decisão de produto: cada campo extra derruba a taxa de resposta, e o anfitrião
conhece pessoalmente todos os convidados.

Sem identificador único, três problemas aparecem:

1. **Duplicata.** A pessoa toca "enviar" duas vezes por insegurança da conexão.
2. **Mudança de ideia.** Respondeu "vou" na segunda, o filho ficou doente na
   sexta, quer trocar para "não vou".
3. **Grafia inconsistente.** "Maria Clara", "maria clara", "MARIA CLARA".

## Decisão

Derivar uma **chave natural** determinística do nome:

```
"Maria Clara"  ─┐
"maria clara"  ─┼─▶  GuestKey("maria-clara")
"MARIA  CLARA" ─┤
"María Clara"  ─┘
```

Algoritmo (`GuestKey.deriveFrom`): NFD → remove marcas diacríticas
(`U+0300, U+036F`) → minúsculas → não-alfanumérico vira `-` → apara hífens das
pontas.

Consequências no desenho:

- `UNIQUE(guest_key)` no Postgres;
- `save()` é um único `INSERT … ON CONFLICT (guest_key) DO UPDATE`, sem
  transação. O que casa com o driver HTTP do Neon
  ([ADR-0003](./0003-neon-postgres-com-drizzle.md));
- `id` e `responded_at` ficam **fora** do `SET`: identidade e momento da primeira
  resposta não mudam quando alguém muda de ideia;
- o `guest_name` exibido é atualizado para a grafia mais recente. A chave ignora
  caixa e acento, mas o convite deve mostrar o nome como a pessoa escreveu;
- reenvio idêntico é **no-op sem evento** (`Rsvp.reconsider` compara antes de
  mudar).

## Consequências

**Boas:** formulário com um campo; segundo toque no botão não duplica nada;
"mudei de ideia" funciona sem link mágico, token ou e-mail; a idempotência é
garantida pelo banco, não por código otimista.

**Ruins. E este é o trade-off central:**

- **homônimos colidem.** Duas "Maria Silva" diferentes na mesma família viram uma
  linha só, e a segunda sobrescreve a primeira **silenciosamente**.

  Aceito, porque: o número de convidados é pequeno e conhecido; o anfitrião
  revisa a lista antes da festa; e a alternativa (pedir e-mail ou sobrenome
  obrigatório) custa mais respostas do que resolve.

  **Mitigação disponível** se acontecer: o convidado escreve "Maria Silva (tia)",
  que gera `maria-silva-tia`. A dica está no texto de apoio do formulário.

- **qualquer um pode sobrescrever a resposta de qualquer um** que conheça o nome.
  Não há autenticação. Num convite familiar distribuído por WhatsApp, o risco é
  irrelevante. Mas é real e está registrado.

- mudar o algoritmo de derivação no futuro exige migração de dados, porque as
  chaves antigas continuariam gravadas.

## Alternativas consideradas

| Alternativa                                  | Por que não                                                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| E-mail ou telefone como identificador        | Resolve homônimo, mas adiciona campo obrigatório e reduz resposta. O custo maior do projeto.                     |
| Lista prévia de convidados com token no link | Identificação perfeita, porém exige cadastrar todos e gerar um link por pessoa. Muito trabalho para o anfitrião. |
| `INSERT` sempre + deduplicar depois          | Empurra o problema para o anfitrião, que teria que decidir na mão qual "Maria Silva" vale.                       |
| UUID em cookie/localStorage                  | Quebra se a pessoa abre no navegador do WhatsApp e depois no Chrome. Cenário comum no celular.                   |
