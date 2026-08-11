# Definition of Done

Vale para **toda** história, sem exceção negociada no fim da sprint. "Done" aqui
significa: pode ir para o convidado hoje.

## 1. Código

- [ ] Critérios de aceite em Gherkin todos atendidos e demonstráveis.
- [ ] `npm run verify` verde — encadeia:
  - `npm run typecheck` (`tsc --noEmit`, zero erro)
  - `npm run lint` (inclui as zonas da Regra da Dependência)
  - `npm run test` (Vitest, zero falha)
- [ ] `npm run build` conclui sem warning novo.
- [ ] `npm run format:check` sem pendência.
- [ ] Sem `any`, sem `@ts-expect-error`, sem `eslint-disable` — ou, se houver,
      com comentário explicando por que a alternativa é pior.
- [ ] Nenhum `console.log` de depuração. `console.info`/`error` só onde é log
      intencional de produção.

## 2. Arquitetura

- [ ] A **Regra da Dependência** foi respeitada: domínio sem framework, aplicação
      sem adapter concreto, `new` de implementação só no Composition Root.
- [ ] Regra de negócio nova está no **agregado ou no Value Object**, não no
      componente, na Server Action nem no repositório.
- [ ] Termo novo do negócio foi adicionado ao
      [glossário](../architecture/ubiquitous-language.md).
- [ ] Decisão que restringe alternativas futuras virou **ADR**.
- [ ] Nenhum import cruzado entre Bounded Contexts.

## 3. Testes

- [ ] Regra nova tem teste de unidade que **falha** se a regra for removida.
- [ ] Caminho de erro coberto, não só o caminho felizes.
- [ ] Testes rodam sem banco, sem rede e sem navegador (exceto os de integração
      explicitamente marcados).
- [ ] Suíte completa continua abaixo de 5 segundos.

## 4. Mobile e experiência

- [ ] Verificado em viewport de **360×640** e em **iPhone SE**: sem rolagem
      horizontal, sem texto cortado, sem sobreposição.
- [ ] Alvos de toque ≥ **48px** (o padrão do projeto é 52px).
- [ ] Testado em **device físico real** — não só no emulador do DevTools.
- [ ] Estados de carregamento e erro têm feedback visível (não só spinner
      infinito).
- [ ] Funciona com **JavaScript desabilitado** no que é essencial (envio do RSVP).

## 5. Acessibilidade

- [ ] Navegável por teclado, com foco visível em todo controle interativo.
- [ ] Campos com `<label>` associado; grupos de opção em `fieldset`/`legend`.
- [ ] Mensagem de erro anunciada (`role="alert"` / `aria-live`) e ligada ao campo
      por `aria-describedby`.
- [ ] Contraste de texto ≥ **4.5:1** (medido, não estimado).
- [ ] `prefers-reduced-motion` respeitado em CSS, Motion, confete e WebGL.
- [ ] Elemento puramente decorativo é `aria-hidden` e não recebe foco.

## 6. Performance

- [ ] Nenhuma dependência nova sem justificativa registrada; dependência sem uso
      é removida.
- [ ] Recurso pesado (WebGL, confete, mapa) carrega **sob demanda** e não bloqueia
      a primeira dobra.
- [ ] Nenhuma regressão de LCP perceptível em 4G simulado.

## 7. Documentação

- [ ] `docs/` atualizado no que a história mudou (arquitetura, glossário, ADR).
- [ ] Backlog atualizado: status, pontos entregues.
- [ ] `README.md` atualizado se mudou setup, script ou variável de ambiente.
- [ ] `.env.example` atualizado se surgiu variável nova.

## 8. Entrega

- [ ] Commit com mensagem que explica o **porquê**, não só o quê.
- [ ] Deploy de preview na Vercel aberto e testado no celular.
- [ ] Migração de banco, se houver, aplicada e reversível (ou com plano de
      rollback registrado).
- [ ] Aceite da PO (Marina) sobre o comportamento, não sobre o código.

---

## Nota sobre honestidade do DoD

Um DoD que ninguém cumpre é pior que nenhum. Dois itens deste checklist **não
estão automatizados** e dependem de disciplina manual:

- **teste em device físico** (item 4);
- **contraste medido e auditoria de leitor de tela** (item 5) — o PBI-10 existe
  justamente para transformar isso em verificação sistemática.

Quando um item for pulado, isso é dito no Sprint Review como débito assumido, não
omitido.
