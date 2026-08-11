# Definition of Ready

Uma história só entra em Sprint Backlog se **todos** os itens abaixo estiverem
verdadeiros. Se um item falha, a história volta ao refinamento — não entra "para
resolver durante a sprint".

## Checklist

- [ ] **Formato de história de usuário completo**: _Como \<persona do
      [personas.md](./personas.md)>, quero \<ação>, para \<benefício>_. A persona é
      nomeada, não "usuário".
- [ ] **Critérios de aceite em Gherkin**, cobrindo o caminho felizes **e** ao
      menos um caminho de erro. Cada cenário é observável de fora — descreve o que
      o convidado vê, não como o código faz.
- [ ] **Estimada em story points** pelo time, sem outlier não discutido.
- [ ] **Priorizada em MoSCoW** com justificativa registrada no backlog.
- [ ] **INVEST verificado**:
  - **I**ndependente — pode ir para produção sem esperar outra história;
  - **N**egociável — descreve o problema, não a solução técnica;
  - **V**aliosa — dá para explicar o ganho para a Marina em uma frase;
  - **E**stimável — não há incógnita que impeça estimar (se houver, vira spike);
  - **S**mall — cabe em uma sprint com folga (≤ 8 pts);
  - **T**estável — os critérios de aceite viram teste automatizado ou item de
    checklist manual.
- [ ] **Impacto arquitetural avaliado**: a história cabe nos Bounded Contexts
      existentes? Precisa de porta nova, migração, ou ADR? Se precisar de ADR, ele é
      escrito **antes** de a história entrar na sprint.
- [ ] **Dependência externa resolvida ou explícita**: dado que falta (endereço,
      coordenada, texto), acesso, credencial. Dependência aberta é bloqueio
      registrado, não surpresa de quinta-feira.
- [ ] **Impacto mobile pensado**: o que essa história faz num Android de 3 anos
      em 4G? Se adiciona peso ao cliente, o custo está declarado.
- [ ] **Sem quebra de acessibilidade conhecida**: alvo de toque, contraste,
      leitor de tela e `prefers-reduced-motion` considerados.

## Exemplo — PBI-05 passa no DoR

| Item         | Evidência                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| História     | _Como Marina, quero ver a lista de quem vem e quem não vem com os totais, para fechar o número com o buffet sem pedir ajuda._       |
| Gherkin      | 2 cenários, incluindo acesso sem token → 404                                                                                        |
| Estimativa   | 8 pts                                                                                                                               |
| MoSCoW       | `MUST` — sem isso o objetivo do produto não se realiza                                                                              |
| INVEST       | Independente do resto do backlog; testável via caso de uso de consulta                                                              |
| Arquitetura  | Precisa de `listAll()` na porta `RsvpRepository` + caso de uso `GetRsvpSummary`. Não exige ADR: não restringe alternativas futuras. |
| Dependências | Token em variável de ambiente na Vercel — a criar                                                                                   |
| Mobile       | Painel também é aberto no celular pela Marina                                                                                       |
| A11y         | Tabela com `<caption>` e cabeçalhos de coluna                                                                                       |

## Exemplo — PBI-16 **não** passa

_Link personalizado por convidado._ Falha em **Small** (13 pts) e em
**Estimável**: não está definido se os anfitriões cadastrariam os convidados à
mão nem como o link seria distribuído. Precisa de um spike de descoberta antes.
