# ADR-0007. Dados da festa em arquivo de configuração, não no banco

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

O contexto Celebration precisa de: nome e idade da aniversariante, início/fim da
festa com fuso, nome do local, endereço e coordenadas.

Esses dados mudam **algumas vezes antes** da festa e **nunca depois**. Não há
tela de administração no escopo, não há mais de uma festa, e ninguém edita isso
em produção às 3 da manhã.

## Decisão

Um único arquivo versionado:
`src/contexts/celebration/infrastructure/celebration.config.ts`, com marcadores
`[PLACEHOLDER]` no que os anfitriões precisam confirmar.

- `StaticCelebrationRepository` implementa a porta `CelebrationRepository`
  mapeando esse objeto para o agregado `Celebration`.
- A conversão passa **obrigatoriamente** pelas factories dos Value Objects, então
  uma latitude trocada por longitude, um horário invertido ou um endereço vazio
  **quebram o boot** em vez de gerar convite errado.
- `static-celebration.repository.spec.ts` cobre o arquivo: valida o agregado,
  checa se as coordenadas caem no Brasil e se o read model é serializável.
- A porta existe. Substituir por CMS ou tabela é implementar outro adapter e
  trocar uma linha no Composition Root.

## Consequências

**Boas:** mudança de local vira commit revisável com histórico ("mudamos o
endereço no dia 3"); nenhuma consulta ao banco para renderizar a página (que
fica 100% estática); erro de digitação é pego em `npm run test`; um dado só,
numa fonte só.

**Ruins:**

- **anfitrião não-programador depende de um dev** para mudar o endereço. Aceito e
  mitigado: um arquivo, comentado em português, com instruções de como obter as
  coordenadas no Google Maps;
- qualquer alteração exige novo deploy (~1 min na Vercel);
- o endereço fica público no repositório. O repositório é privado por padrão; se
  virar público, o endereço de uma festa infantil deveria sair dele.

## Alternativas consideradas

| Alternativa                          | Por que não                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Tabela `celebrations` no Neon        | Migração, seed e consulta em runtime para um dado que muda três vezes. E a página deixaria de ser estática. |
| Variáveis de ambiente                | Sem tipagem estruturada, sem histórico, painel da Vercel é pior editor que um `.ts` comentado.              |
| CMS headless (Sanity, Contentful)    | Editor amigável, mas mais um serviço, mais uma key e mais uma latência num convite de uma página.           |
| Valores fixos direto nos componentes | Espalha a mesma data por 4 arquivos e garante que um deles vai ficar desatualizado.                         |
