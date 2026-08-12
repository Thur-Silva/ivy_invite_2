# ADR-0001. Registrar decisões arquiteturais como ADR

- **Status:** aceito
- **Data:** 2026-08-11
- **Decisores:** time do projeto

## Contexto

Projeto pequeno, prazo curto, uma pessoa escrevendo código na maior parte do
tempo. Exatamente o cenário em que decisões viram folclore: seis meses depois
ninguém lembra por que o mapa não usa API key, e a "correção" reintroduz o
problema original.

DDD depende de decisões explícitas. Bounded Context, tipo de relação entre
contextos, onde uma invariante mora. Sem registro, a linguagem ubíqua degrada e
a camada de domínio começa a importar ORM "só dessa vez".

## Decisão

Toda decisão que **restringe alternativas futuras** vira um ADR numerado e
imutável em `docs/architecture/adr/`.

- Numeração sequencial, nome em kebab-case, português.
- Um ADR nunca é editado depois de aceito: é **substituído** por outro que o
  marca como `substituído por ADR-XXXX`.
- Formato fixo: Contexto → Decisão → Consequências → Alternativas consideradas.
- Não vira ADR: escolha de nome de variável, formatação, ordem de props.

## Consequências

**Boas:** o "porquê" sobrevive à rotação de pessoas; revisão de código discute a
decisão registrada, não a preferência de quem escreveu; onboarding é ler 10
arquivos curtos.

**Ruins:** custo por decisão (~10 minutos). Aceito. É menor que uma reunião
sobre algo já decidido.

## Alternativas consideradas

| Alternativa                 | Por que não                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| Comentários no código       | Explicam o "como", não sobrevivem a refatoração e ninguém lê um comentário de arquivo deletado. |
| Página no Confluence/Notion | Fora do repositório, sem versionamento junto ao código, sem revisão em PR.                      |
| Nada                        | O modo padrão de perder arquitetura.                                                            |
