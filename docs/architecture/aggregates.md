# Agregados, invariantes e Event Storming

## 1. Event Storming (resumo da sessão)

Ordem cronológica dos eventos de negócio, com o comando que os provoca e o ator:

```
[Ator: Anfitrião]                     [Ator: Convidado]
                                       ┌────────────────────────────────┐
CONVITE PUBLICADO ────────────────────▶ │ abre o link no WhatsApp        │
(fora do sistema: mandar o link)        │                                │
                                        │ lê a introdução e a data       │
                                        │                                │
                        Comando: SubmitRsvp                              │
                                        ▼                                │
                              ╔═══════════════════════╗                  │
                              ║ RsvpConfirmed         ║ ◀── "Eu vou!"    │
                              ║ RsvpDeclined          ║ ◀── "Não vou"    │
                              ╚═══════════════════════╝                  │
                                        │                                │
                        Comando: SubmitRsvp (de novo)                     │
                                        ▼                                │
                              ╔═══════════════════════╗                  │
                              ║ RsvpDecisionChanged   ║ ◀── mudou de ideia
                              ╚═══════════════════════╝                  │
                                        │                                │
                                        ▼ (reenvio idêntico)              │
                                    (nenhum evento — idempotente)        │
                                                                         │
                                        │ toca "abrir no mapa" ──────────┘
                                        ▼
                                (fora do sistema: navegação)
```

**Hot spots levantados e como foram resolvidos:**

| Dúvida                                 | Resolução                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| Duas pessoas com o mesmo nome?         | Vira a mesma resposta. Aceito — ver [ADR-0009](./adr/0009-chave-natural-do-convidado.md). |
| Convidado responde por três pessoas?   | Sprint 1: um envio por nome. Acompanhantes é PBI-07.                                      |
| Convidado quer cancelar?               | É "mudar de ideia" para `NOT_ATTENDING`. Não existe exclusão.                             |
| Anfitrião precisa da lista quando?     | Uma semana antes. Não precisa de painel no Sprint 1 (`db:studio` resolve).                |
| Alguém pode responder depois da festa? | Sim, e não faz mal. Fechar prazo seria regra nova sem valor.                              |

## 2. Aggregate Root: `Rsvp`

**Fronteira de consistência:** um convidado (identificado por `GuestKey`) tem
**exatamente uma** resposta a qualquer momento.

`src/contexts/rsvp/domain/rsvp.aggregate.ts`

```
Rsvp (Aggregate Root)
├── id: RsvpId                 ← gerado pela aplicação, nunca pelo banco
├── guestName: GuestName       ← VO com invariante de nome
├── guestKey: GuestKey         ← derivado de guestName (não é armazenado no agregado)
├── decision: AttendanceDecision
├── respondedAt: Date          ← imutável após a criação
└── updatedAt: Date
```

### Invariantes protegidas

| #   | Invariante                                                                   | Onde é garantida                                                      |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| I1  | O nome nunca está em branco, tem 2–60 caracteres e contém ao menos uma letra | `GuestName.create`                                                    |
| I2  | O nome não contém dígitos, emoji ou URL                                      | `GuestName.create`                                                    |
| I3  | A resposta é exatamente `ATTENDING` ou `NOT_ATTENDING`                       | `AttendanceDecision.fromValue` + `CHECK` do enum Postgres             |
| I4  | Um convidado tem no máximo uma resposta                                      | `UNIQUE(guest_key)` + `findByGuestKey` antes de criar                 |
| I5  | `respondedAt` nunca muda depois da criação                                   | `reconsider()` não toca no campo; `ON CONFLICT` não o inclui no `SET` |
| I6  | `updatedAt` só avança quando algo mudou de fato                              | `reconsider()` retorna cedo se resposta e nome são idênticos          |
| I7  | Reenviar a mesma resposta não gera evento                                    | `reconsider()` compara antes de registrar                             |
| I8  | Nenhum evento é publicado para uma escrita que falhou                        | `pullDomainEvents()` é chamado **depois** do `save`                   |

### Regras que **não** são invariantes do agregado

Registradas para não serem acidentalmente movidas para dentro:

- **"O convidado é reconhecido pelo nome normalizado"** — é regra de
  _identificação_, mora em `GuestKey` e é usada pelo caso de uso, não pelo
  agregado.
- **"Não conseguimos salvar agora, tente de novo"** — é resultado de
  infraestrutura, mora no `Result` da camada de aplicação.
- **"Escolha 'vou' ou 'não vou' antes de enviar"** — é validação de _formato_ de
  formulário, mora no Zod da Server Action.

### Determinismo

O agregado **nunca** lê o relógio nem gera identificadores. `respondedAt`,
`changedAt` e `RsvpId` chegam como argumento. Consequência prática: os 8 testes
do agregado não têm mocks, `vi.useFakeTimers()` nem `Date.now()`.

## 3. Aggregate Root: `Celebration`

**Fronteira de consistência:** os dados da festa formam um conjunto que só faz
sentido validado em bloco (uma coordenada inválida invalida o mapa; um horário
invertido invalida o card de data).

`src/contexts/celebration/domain/celebration.aggregate.ts`

```
Celebration (Aggregate Root)
├── id: CelebrationId   ← "ivy-2-anos", único
├── honoree: Honoree
├── schedule: CelebrationSchedule
└── venue: Venue → GeoCoordinates
```

| #   | Invariante                                           | Onde                         |
| --- | ---------------------------------------------------- | ---------------------------- |
| I9  | Aniversariante tem nome e idade inteira ≥ 1          | `Honoree.create`             |
| I10 | A festa termina depois de começar; datas são válidas | `CelebrationSchedule.create` |
| I11 | Latitude ∈ [-90, 90], longitude ∈ [-180, 180]        | `GeoCoordinates.create`      |
| I12 | Local tem nome e endereço não vazios                 | `Venue.create`               |

Este agregado **não expõe comportamento** além de guardar sua própria
consistência — é leitura pura no Sprint 1. Ele existe como agregado (em vez de
um objeto solto) por dois motivos: as invariantes I9–I12 precisam de um dono, e
a história "anfitrião edita os dados da festa" cai aqui sem reescrita.

## 4. Por que não há mais agregados

| Candidato descartado | Por quê                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Guest`              | Não há cadastro de convidados. Modelar um seria inventar estado que ninguém mantém.                                                                                         |
| `Invitation`         | Existe um convite só, e ele é a página. Um agregado com uma instância eterna e nenhum comportamento é uma tabela disfarçada.                                                |
| `GuestList`          | Seria um agregado gigante (todas as respostas) com contenção de escrita em cada RSVP. Consultas agregadas são trabalho de _read model_, não de agregado — chegam no PBI-05. |
