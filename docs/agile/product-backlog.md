# Product Backlog

Ordenado por valor (topo = próximo a ser puxado). Estimativas em **story points**
(Fibonacci), priorização em **MoSCoW**. Toda história segue INVEST e só entra em
sprint se passar no [Definition of Ready](./definition-of-ready.md).

| Status | Significado                                    |
| ------ | ---------------------------------------------- |
| ✅     | Done. Atende ao [DoD](./definition-of-done.md) |
| 🔄     | Em andamento                                   |
| 📋     | Ready. Refinado, estimado, pode ser puxado     |
| 💭     | Ideia. Precisa de refinamento                  |

---

## Entregue no Sprint 1

### ✅ PBI-00. Fundação arquitetural (enabler)

> **Como** time, **quero** camadas de domínio, aplicação, infraestrutura e
> apresentação separadas e verificadas automaticamente, **para** que regra de
> negócio seja testável sem banco e sem navegador.

`MUST` · **8 pts**

**Critérios de aceite**

```gherkin
Cenário: a Regra da Dependência é executável
  Dado um import de "drizzle-orm" dentro de src/contexts/*/domain
  Quando eu rodo "npm run lint"
  Então o comando falha com mensagem explicando a camada violada

Cenário: regra de negócio testável sem infraestrutura
  Dado o pipeline "npm run verify"
  Quando ele executa
  Então typecheck, lint e testes passam
  E nenhum teste exige banco, servidor ou navegador
  E a suíte completa roda em menos de 5 segundos
```

**Entregue:** 2 Bounded Contexts, 4 camadas, 12 ADRs, 32 testes (<1s),
`no-restricted-imports` por zona, migração Drizzle versionada.

---

### ✅ PBI-01. Ver o convite

> **Como** Tia Cida, **quero** abrir o link e entender em segundos de quem é a
> festa, quando é e qual o tema, **para** decidir se vou.

`MUST` · **5 pts**

```gherkin
Cenário: primeira dobra em celular
  Dado que abro o link em um celular de 360px de largura
  Quando a página carrega
  Então vejo o nome "Ivy", a idade "2 anos" e o tema "A Princesa e o Sapo"
  E não preciso rolar para ver essa informação
  E não há rolagem horizontal

Cenário: introdução curta
  Quando eu rolo até a seção "O convite"
  Então leio no máximo dois parágrafos
  E vejo dia da semana, data e horário num card único

Cenário: dispositivo que prefere menos animação
  Dado que meu sistema tem "prefers-reduced-motion: reduce"
  Quando a página carrega
  Então a cena WebGL não é montada
  E todo o conteúdo permanece legível sobre um gradiente estático
```

---

### ✅ PBI-02. Confirmar presença

> **Como** convidado, **quero** dizer meu nome e se vou ou não, **para** que os
> anfitriões saibam com quem contar.

`MUST` · **8 pts**. O coração do produto

```gherkin
Cenário: confirmo que vou
  Dado que estou na seção "Confirme sua presença"
  Quando escrevo "Maria Clara", toco em "Eu vou!" e envio
  Então minha resposta é gravada com decisão ATTENDING
  E vejo um selo real com meu primeiro nome
  E vejo confete

Cenário: aviso que não vou
  Quando escrevo meu nome, toco em "Não vou poder" e envio
  Então minha resposta é gravada com decisão NOT_ATTENDING
  E vejo uma mensagem afetuosa, sem confete

Cenário: esqueci de escolher
  Quando escrevo meu nome e envio sem tocar em nenhuma opção
  Então vejo 'Toque em "Eu vou!" ou "Não vou poder" antes de enviar.'
  E o nome que eu digitei continua no campo

Cenário: nome inválido
  Quando envio "A" ou "Maria 123"
  Então vejo uma mensagem em português explicando o que é aceito
  E nada é gravado

Cenário: toquei duas vezes no botão
  Dado que já enviei "Maria Clara" / "Eu vou!"
  Quando envio exatamente a mesma resposta
  Então continua existindo uma única resposta minha
  E nenhum evento de domínio novo é publicado

Cenário: banco indisponível
  Dado que o banco está fora do ar
  Quando eu envio minha resposta
  Então vejo "Não conseguimos guardar sua resposta agora. Tente novamente em instantes."
  E a aplicação não quebra

Cenário: sem JavaScript
  Dado que o JavaScript está desabilitado
  Quando eu preencho e envio o formulário
  Então minha resposta é gravada normalmente
```

---

### ✅ PBI-04. Mudar de ideia

> **Como** convidado que já respondeu, **quero** trocar minha resposta,
> **para** avisar que meus planos mudaram.

`MUST` · **3 pts**. Implementado junto ao PBI-02 (mesma fronteira de agregado)

```gherkin
Cenário: troco vou por não vou
  Dado que respondi "Eu vou!" como "Maria Clara"
  Quando respondo de novo como "maria clara" escolhendo "Não vou poder"
  Então minha resposta passa a ser NOT_ATTENDING
  E continua existindo uma única linha para mim
  E o momento da minha primeira resposta é preservado
  E vejo "Atualizamos sua resposta anterior."

Cenário: a grafia mais recente é a que vale
  Dado que respondi como "maria clara"
  Quando respondo de novo como "Maria Clara"
  Então o nome exibido na lista passa a ser "Maria Clara"
```

---

### ✅ PBI-03. Saber onde é e como chegar

> **Como** convidado, **quero** ver o endereço e abrir a rota no meu app de
> navegação, **para** chegar sem me perder.

`MUST` · **5 pts**

```gherkin
Cenário: vejo o local
  Quando rolo até "Onde acontece"
  Então vejo nome do espaço, rua com número, bairro e cidade
  E vejo uma prévia do mapa

Cenário: abro a navegação
  Quando toco em "Abrir no Google Maps"
  Então o app abre com a rota até as coordenadas exatas da entrada
  E existe também a opção "Abrir no Waze"

Cenário: o mapa não custa nada até ser visto
  Dado que o mapa está no fim da página
  Então o iframe usa loading="lazy"
  E nenhuma chave de API é exposta ao navegador
```

⚠️ **Bloqueio conhecido:** endereço, coordenadas e data em
`celebration.config.ts` estão marcados `[PLACEHOLDER]`. A publicação depende dos
anfitriões confirmarem. Ver risco R1 da [visão](./product-vision.md).

---

### ✅ PBI-17. Cena que acompanha a leitura

> **Como** Rafa, **quero** que a página tenha vida enquanto eu rolo, **para** que
> o convite pareça um conto de fadas e não um formulário bonito.

`SHOULD` · **5 pts**. Puxado após feedback da PO no meio do Sprint 1

```gherkin
Cenário: algo me acompanha do início ao fim
  Dado que abro o convite e começo a rolar
  Então um vaga-lume desce junto comigo sobre uma trilha luminosa
  E a trilha se desenha conforme eu avanço
  E ele chega ao fim da página junto comigo

Cenário: eventos durante a rolagem
  Quando eu passo pelo início de cada seção
  Então uma vitória-régia acende e gira naquele ponto da trilha
  E um anel de água se abre e desaparece
  E ao chegar no encerramento uma coroa aparece no fim da trilha

Cenário: nenhum emoji de teclado na interface
  Quando eu inspeciono as opções do formulário e os botões de mapa
  Então todo ícone é SVG do próprio tema, e não emoji do sistema
  E o ícone da opção escolhida cresce e se inclina

Cenário: quem prefere menos movimento
  Dado que meu sistema tem "prefers-reduced-motion: reduce"
  Então a trilha, o vaga-lume e as pétalas não são montados
  E o convite continua completo e legível
```

**Notas técnicas:** ver [ADR-0011](../architecture/adr/0011-cena-que-acompanha-o-scroll.md)
(o alinhamento vaga-lume/trilha é dedução matemática, sem medição em runtime) e
[ADR-0012](../architecture/adr/0012-sem-emoji-de-teclado-na-interface.md).

---

## Sprint 2 (candidato)

### 📋 PBI-05. Painel do anfitrião

> **Como** Marina, **quero** ver a lista de quem vem e quem não vem com os
> totais, **para** fechar o número com o buffet sem pedir ajuda.

`MUST` · **8 pts**

```gherkin
Cenário: vejo a lista consolidada
  Dado que acesso /anfitriao com o token secreto correto
  Então vejo total de confirmados, total de recusas e a lista de nomes
  E a lista está ordenada pela resposta mais recente

Cenário: sem o token
  Quando acesso /anfitriao sem token ou com token errado
  Então recebo 404, sem revelar que a rota existe
```

**Notas técnicas:** adiciona `listAll()` / `countByDecision()` à porta
`RsvpRepository` (hoje deliberadamente mínima) e um caso de uso de consulta
`GetRsvpSummary`. Token via variável de ambiente, comparado em tempo constante.

---

### 📋 PBI-06. Notificar os anfitriões a cada resposta

> **Como** Marina, **quero** receber um aviso quando alguém responder, **para**
> acompanhar sem ficar abrindo o painel.

`SHOULD` · **5 pts**

**Notas técnicas:** o seam já existe. Implementar `DomainEventPublisher`
assinando `RsvpConfirmed` / `RsvpDeclined` / `RsvpDecisionChanged`. Nenhuma
mudança em domínio ou caso de uso.

---

### 📋 PBI-11. Proteção contra flood

> **Como** anfitrião, **quero** que ninguém consiga poluir a lista com centenas
> de respostas falsas, **para** confiar no número.

`SHOULD` · **3 pts**. Risco aceito no Sprint 1, ver [ADR-0004](../architecture/adr/0004-server-actions-como-adapter-de-entrada.md)

---

### 📋 PBI-14. Teste de integração do repositório Neon

> **Como** time, **quero** provar que o upsert por `guest_key` funciona no
> Postgres real, **para** não descobrir divergência com o in-memory na festa.

`SHOULD` · **3 pts**

---

### 📋 PBI-10. Acessibilidade AA verificada em device real

> **Como** convidado com baixa visão ou leitor de tela, **quero** navegar o
> convite inteiro, **para** responder sem ajuda.

`SHOULD` · **3 pts**. Inclui auditoria com VoiceOver/TalkBack e contraste medido

---

### 📋 PBI-07. Informar acompanhantes

> **Como** convidado, **quero** dizer que vou levar meu filho, **para** que a
> contagem esteja certa.

`SHOULD` · **5 pts**

**Notas técnicas:** adiciona o Value Object `PartySize` (1..10) ao agregado
`Rsvp` + migração. **Não foi feito no Sprint 1 por decisão de escopo explícita**
, o pedido original era nome + vou/não_vou, e antecipar o campo teria custado
taxa de resposta (ver persona Tia Cida).

---

### 📋 PBI-09. Adicionar ao calendário

`COULD` · **3 pts**. `.ics` + link do Google Calendar. `CelebrationSchedule` já
tem tudo que é necessário.

---

## Backlog distante

| ID        | História                                               | MoSCoW          | Pts |
| --------- | ------------------------------------------------------ | --------------- | --- |
| 💭 PBI-08 | Recadinho para a Ivy junto da confirmação              | `COULD`         | 5   |
| 💭 PBI-12 | Trilha sonora opcional (com controle de mudo evidente) | `COULD`         | 3   |
| 💭 PBI-13 | Instruções de estacionamento e ponto de referência     | `COULD`         | 2   |
| 💭 PBI-15 | Exportar lista de confirmados em CSV                   | `WON'T` (agora) | 2   |
| 💭 PBI-16 | Link personalizado por convidado (resolve homônimos)   | `WON'T` (agora) | 13  |

**`WON'T` explícito:** lista de presentes, PIX, galeria de fotos, login de
convidado, internacionalização, app nativo. Ver
[fora de escopo](./product-vision.md#fora-de-escopo-declarado).

---

## Velocidade

| Sprint | Comprometido | Entregue   | Observação                                                   |
| ------ | ------------ | ---------- | ------------------------------------------------------------ |
| 1      | 29 pts       | **34 pts** | 29 comprometidos + PBI-17 (5 pts) puxado após feedback da PO |
| 2      |              | ,          | capacidade planejada: ~25 pts                                |
