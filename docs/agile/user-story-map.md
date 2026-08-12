# User Story Map

Eixo horizontal: a jornada do convidado, na ordem em que acontece.
Eixo vertical: fatias de release. A linha de cima é o mínimo que já entrega
valor; cada linha abaixo é um incremento.

```
JORNADA →   RECEBER          ENTENDER            RESPONDER          CHEGAR           LEMBRAR
            o convite        a festa             presença           na festa         do dia
          ┌──────────────┬───────────────────┬──────────────────┬────────────────┬──────────────┐
RELEASE 1 │ PBI-01       │ PBI-01            │ PBI-02           │ PBI-03         │              │
"convite  │ abrir o link │ ver tema, nome,   │ digitar nome e   │ ver endereço,  │, │
 no ar"   │ e carregar   │ idade, data,      │ escolher         │ mapa e abrir   │              │
✅ Sprint 1│ rápido       │ horário           │ vou / não vou    │ no Maps/Waze   │              │
          │              │                   │ + PBI-04 mudar   │                │              │
          │              │                   │   de ideia       │                │              │
          ├──────────────┼───────────────────┼──────────────────┼────────────────┼──────────────┤
RELEASE 2 │              │                   │ PBI-07           │                │ PBI-09       │
"anfitrião│, │, │ informar         │, │ adicionar ao │
 no       │              │                   │ acompanhantes    │                │ calendário   │
 controle"│              │                   │                  │                │              │
⏳Sprint 2 │              │                   │ PBI-05 painel do anfitrião (lista + contagem)   │
          │              │                   │ PBI-06 notificar anfitriões a cada resposta      │
          ├──────────────┼───────────────────┼──────────────────┼────────────────┼──────────────┤
RELEASE 3 │              │ PBI-12            │ PBI-08           │ PBI-13         │              │
"encanto  │, │ trilha sonora     │ recadinho para   │ instruções de  │, │
 completo"│              │ opcional          │ a Ivy            │ estacionamento │              │
⏳Sprint 3 │              │                   │                  │                │              │
          └──────────────┴───────────────────┴──────────────────┴────────────────┴──────────────┘

TRANSVERSAIS (não aparecem na jornada, sustentam tudo)
  PBI-00 arquitetura, camadas e pipeline de verificação ........ ✅ Sprint 1
  PBI-10 acessibilidade AA verificada em device real ........... ⏳ Sprint 2
  PBI-11 rate limiting / anti-flood ........................... ⏳ Sprint 2
  PBI-14 teste de integração do NeonRsvpRepository ............. ⏳ Sprint 2
```

## Por que o Release 1 corta aqui

A fatia mínima tem que resolver o problema de negócio inteiro para **um**
convidado: ele recebe, entende, responde e sabe chegar. Tudo o que sobrou é
melhoria da experiência do **anfitrião** ou encanto extra.

O corte foi testado com a pergunta certa: _"se só isso for para o ar, os
anfitriões conseguem contar quantas pessoas vêm?"_. Sim. Via
`npm run db:studio`, o que é feio mas funciona, e é exatamente por isso que
PBI-05 é o topo do backlog do Sprint 2 em vez de estar no Sprint 1.

## Walking skeleton

O PBI-00 não é uma história de usuário. É o esqueleto que atravessa todas as
camadas antes de qualquer feature: formulário → Server Action → caso de uso →
agregado → repositório → Postgres, com teste em cada nível. Foi feito primeiro
justamente para que PBI-01 a PBI-04 fossem só preencher carne no osso.
