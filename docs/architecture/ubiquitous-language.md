# Ubiquitous Language

Vocabulário único entre anfitriões, código e banco. Se um termo daqui aparecer
numa conversa, ele significa exatamente isto. E se alguém propuser um sinônimo,
ou o glossário muda, ou o sinônimo morre.

O código do domínio está em inglês ([ADR-0010](./adr/0010-ubiquitous-language-em-ingles.md));
a coluna PT-BR é a palavra que os anfitriões usam.

## Bounded Context: RSVP (core)

| PT-BR (negócio)        | Código (inglês)         | Tipo           | Significado preciso                                                                                                                                                                    |
| ---------------------- | ----------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Convidado              | _guest_                 |                | Pessoa que recebeu o link do convite. **Não é uma entidade**: não temos cadastro de convidados, apenas respostas.                                                                      |
| Resposta / Confirmação | `Rsvp`                  | Aggregate Root | A resposta de **um** convidado ao convite. Um convidado tem no máximo uma.                                                                                                             |
| Nome do convidado      | `GuestName`             | Value Object   | Como a pessoa se identificou. Normalizado (espaços colapsados), só letras, espaço, hífen, apóstrofo e ponto, 2 a 60 caracteres.                                                        |
| Chave do convidado     | `GuestKey`              | Value Object   | Identidade natural derivada do nome: minúsculo, sem acento, palavras unidas por hífen. `"Maria Clara"` → `maria-clara`. É o que reconhece um convidado que volta.                      |
| Vou / Não vou          | `AttendanceDecision`    | Value Object   | Exatamente dois valores: `ATTENDING`, `NOT_ATTENDING`. Não existe "talvez".                                                                                                            |
| Respondeu              | `respondedAt`           | atributo       | Instante da **primeira** resposta. Nunca muda.                                                                                                                                         |
| Mudou de ideia         | `reconsider()`          | método         | Trocar a resposta. Não cria nova `Rsvp`; muda a existente e atualiza `updatedAt`.                                                                                                      |
| Respondente            | `RespondentIdentity`    | Value Object   | Quem enviou a resposta, em três digests irreversíveis: `token` (cookie assinado), `device` (navegador + SO + idioma + resolução + fuso) e `network` (IP). Nenhum valor cru é guardado. |
| É a mesma pessoa       | `isSameRespondentAs()`  | método         | Regra: `mesmo token` **OU** (`mesmo aparelho` **E** `mesma rede`). Exigir os dois na segunda arma é o que impede bloquear a família inteira que divide um Wi-Fi.                       |
| Pode responder?        | `RsvpEligibilityPolicy` | Domain Service | Decide entre criar, atualizar ou recusar. Um aparelho responde por uma pessoa só, e uma resposta pertence a quem a criou.                                                              |
| Traje                  | `DressCode`             | Value Object   | O que vestir, com a paleta validada (nome + hex por cor).                                                                                                                              |
|                        | `RsvpConfirmed`         | Domain Event   | Um convidado respondeu "vou" pela primeira vez.                                                                                                                                        |
|                        | `RsvpDeclined`          | Domain Event   | Um convidado respondeu "não vou" pela primeira vez.                                                                                                                                    |
|                        | `RsvpDecisionChanged`   | Domain Event   | Um convidado que já havia respondido trocou a resposta.                                                                                                                                |

### Vocabulário de resultado (o que o site responde ao convidado)

| Status      | Quando                    | O convidado vê                             |
| ----------- | ------------------------- | ------------------------------------------ |
| `RECORDED`  | primeira resposta         | "Que alegria!" / "Obrigada por avisar"     |
| `UPDATED`   | trocou de resposta        | "Atualizamos sua resposta anterior."       |
| `UNCHANGED` | reenviou a mesma resposta | "Sua resposta já estava registrada assim." |

## Bounded Context: Celebration (supporting)

| PT-BR               | Código                | Tipo           | Significado                                               |
| ------------------- | --------------------- | -------------- | --------------------------------------------------------- |
| Festa / Comemoração | `Celebration`         | Aggregate Root | O evento único a que este site convida.                   |
| Aniversariante      | `Honoree`             | Value Object   | Nome + idade comemorada. Aqui: Ivy, 2 anos.               |
| Horário da festa    | `CelebrationSchedule` | Value Object   | Início, fim e fuso IANA. O fim é sempre depois do início. |
| Local               | `Venue`               | Value Object   | Nome do espaço, endereço, cidade e coordenada da entrada. |
| Coordenada          | `GeoCoordinates`      | Value Object   | Latitude/longitude validadas.                             |

## Termos que decidimos **não** usar

Para evitar ambiguidade em conversas futuras:

| Termo evitado            | Por quê                                                                   | Use                  |
| ------------------------ | ------------------------------------------------------------------------- | -------------------- |
| "Inscrição", "cadastro"  | Sugere conta de usuário, login, senha. Não existe nada disso.             | "resposta", `Rsvp`   |
| "Presença" como entidade | Presença é o **valor** de uma resposta, não uma coisa.                    | `AttendanceDecision` |
| "Lista de convidados"    | Não temos lista prévia; qualquer pessoa com o link responde.              | "lista de respostas" |
| "Usuário"                | O convidado não usa um sistema, ele lê um convite.                        | "convidado"          |
| "Talvez"                 | Não existe no domínio. Se um dia existir, é uma mudança de regra com ADR. |                      |
