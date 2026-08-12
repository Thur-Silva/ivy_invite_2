# Visão de Produto

## Elevator pitch

> **Para** familiares e amigos convidados para o aniversário de 2 anos da Ivy,
> **que** recebem o convite por WhatsApp e abrem no celular,
> **o** Convite da Ivy **é** uma página única encantada
> **que** conta o convite em 15 segundos, recebe a confirmação em dois toques e
> abre o caminho até a festa no app de navegação.
> **Diferente de** um convite em imagem ou um formulário genérico,
> **nosso produto** parece um conto de fadas e ainda entrega aos anfitriões uma
> lista confiável de quem vem.

## Vision Box

**Frente da caixa**

> **O Convite da Ivy**
> _Era uma vez… um lago encantado no seu celular._
>
> - Abre em 2 segundos, funciona até com internet ruim
> - "Eu vou!" em dois toques
> - O caminho até a festa a um toque de distância

**Verso da caixa**

- Um lago animado com vaga-lumes, vitórias-régias e um sapo coroado
- Data e horário num card que dá pra printar e guardar
- Google Maps e Waze com um toque
- Mudou de ideia? Responda de novo. A gente atualiza, não duplica
- Funciona sem JavaScript, respeita quem prefere menos animação
- Sem cadastro, sem senha, sem app pra instalar

## Product Goal (Scrum)

> Ao fim de três sprints, todo convidado da Ivy consegue receber, entender e
> responder o convite pelo celular, e os anfitriões conseguem ver a lista
> consolidada de confirmações sem pedir ajuda a um desenvolvedor.

## Objetivo de negócio

O problema real: **saber quantas pessoas vêm**. Sem isso, os anfitriões erram
comida, lembrancinha e tamanho do espaço. Grupo de WhatsApp não resolve.
mensagem se perde, ninguém consegue contar e não se sabe quem faltou responder.

## Métricas de sucesso

| Métrica                   | Alvo                           | Como medir                                                |
| ------------------------- | ------------------------------ | --------------------------------------------------------- |
| Taxa de resposta          | ≥ 70% dos convidados respondem | linhas em `rsvps` ÷ convites enviados                     |
| Tempo até responder       | ≤ 45s da abertura ao selo      | cronometrado no teste de usabilidade com 3 familiares     |
| Duplicatas na lista       | 0                              | `UNIQUE(guest_key)` garante; conferir na revisão da lista |
| Abandono no formulário    | ≤ 15%                          | qualitativo (perguntar a quem não respondeu)              |
| Reclamação de "não abriu" | 0                              | relato direto dos anfitriões                              |

Sem analytics instalado: é um convite privado, e instrumentar o
comportamento de convidados de uma festa infantil não passa no teste do bom
senso. As métricas vêm do banco e de conversa.

## Fora de escopo (declarado)

Para não voltar como "mas seria fácil…":

- lista de presentes, PIX, cotas de presente
- galeria de fotos ou mural de recados
- login, área do convidado, ingresso com QR code
- versão em outro idioma
- app nativo, PWA instalável
- convite personalizado por pessoa (link único)

## Riscos e premissas

| #   | Risco / premissa                                                               | Impacto                               | Mitigação                                                                                            |
| --- | ------------------------------------------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| R1  | Dados da festa ([PLACEHOLDER] no config) não confirmados até o fim do Sprint 2 | convite publicado com endereço errado | bloqueia a publicação; item no [DoR](./definition-of-ready.md) do PBI-03                             |
| R2  | Celular antigo não renderiza WebGL                                             | convidado vê página quebrada          | degradação em 3 níveis, [ADR-0005](../architecture/adr/0005-stack-de-graficos-e-animacao.md)         |
| R3  | Homônimos sobrescrevem resposta                                                | lista de convidados errada            | aceito, [ADR-0009](../architecture/adr/0009-chave-natural-do-convidado.md); anfitrião revisa a lista |
| R4  | Anfitriões não sabem consultar a lista                                         | objetivo do produto não se realiza    | PBI-05 (painel) priorizado para o Sprint 2                                                           |
| P1  | Todo convidado abre no celular                                                 |                                       | premissa confirmada com os anfitriões; o desktop é só um bônus centralizado                          |
| P2  | O link circula apenas em grupos privados                                       |                                       | justifica ausência de rate limiting no Sprint 1 (PBI-11)                                             |
