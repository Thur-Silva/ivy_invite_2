# Convite da Ivy. 2 anos

Convite digital, mobile-first, para o aniversário de 2 anos da Ivy. Tema: **A
Princesa e o Sapo**.

Uma página, uma rolagem só: lago encantado, introdução e data, confirmação de
presença, traje, como chegar, e um jacaré que engole o vaga-lume no fim.

```
Next.js 16 · React 19 · TypeScript strict · Tailwind CSS v4
React Three Fiber + GLSL · Motion · Lenis
Neon Postgres + Drizzle ORM · Vitest
Arquitetura: DDD + Hexagonal (ports & adapters)
```

---

## Começando

```bash
npm install
npm run dev          # http://localhost:3000
```

Funciona **sem configurar nada**: sem `DATABASE_URL`, as confirmações vão para um
repositório em memória (com aviso no console) e se perdem ao reiniciar. Bom para
desenvolver a interface.

### Com banco de verdade

```bash
cp .env.example .env.local     # e preencha DATABASE_URL com a string do Neon
npm run db:migrate             # aplica as migrações de drizzle/
npm run dev
```

A connection string sai do [console do Neon](https://console.neon.tech) →
projeto → _Connection string_ → modo **Pooled connection**.

---

## ⚠️ Antes de publicar: confirmar os dados da festa

Um arquivo, e é o único que um não-programador precisa tocar:

**`src/contexts/celebration/infrastructure/celebration.config.ts`**

Todos os valores marcados com `[PLACEHOLDER]` são chute e precisam ser
confirmados:

| Campo                          | O que é                                  |
| ------------------------------ | ---------------------------------------- |
| `schedule.startsAt` / `endsAt` | início e fim da festa, com fuso `-03:00` |
| `venue.name`                   | nome do salão ou casa                    |
| `venue.streetAddress`          | rua, número e complemento                |
| `venue.locality`               | bairro, cidade e estado                  |
| `venue.latitude` / `longitude` | coordenadas da entrada                   |

**Como pegar as coordenadas:** abra o Google Maps, clique com o botão direito no
ponto exato da entrada e copie os dois números do topo do menu.

Depois de editar, rode `npm run test`. Há testes que quebram se a data estiver
invertida, o endereço vazio ou a coordenada fora do Brasil.

---

## Login do convidado

Confirmar presença exige entrar com o Google. É o que sustenta a regra
"uma resposta por convidado": burlar passa a exigir criar contas de verdade, não
apagar um cookie. Do login tiramos o primeiro nome do e-mail e já preenchemos o
campo, que continua editável.

Sem credenciais configuradas o projeto **sobe normalmente**: o cartão de login
avisa que o login ainda não está configurado, e o resto do convite funciona. Para
liberar, preencha `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`. O `.env.example` traz o
passo a passo no console do Google.

> **Não defina `AUTH_URL` nem `NEXTAUTH_URL`, em nenhum ambiente.**
>
> O Auth.js infere a URL dos cabeçalhos da requisição, e é isso que faz o mesmo
> código funcionar em localhost e no domínio publicado. Cadastrar a variável com
> o endereço local no painel da Vercel faz o Google devolver o convidado para
> `localhost` depois do consentimento, e o login quebra inteiro. O código descarta
> o valor quando detecta localhost rodando na Vercel, mas o certo é não cadastrar.

Só o Google, por decisão de produto. O Facebook foi avaliado e descartado: exige
app publicado e revisão da Meta, não aceita `localhost` em desenvolvimento, e
traria quase nenhum convidado a mais num público que já usa Android e Gmail. A
estrutura continua plural (`SupportedProvider`, `ACCOUNT_PROVIDERS`), então voltar
a ter dois é acrescentar um provider e um valor no enum do domínio.

## E-mail de confirmação

Quando alguém responde, saem dois e-mails pelo serviço de mensageria, com
propósitos opostos.

**O recibo do convidado** não tem uma linha de regra: nem "uma resposta por
pessoa", nem contagem, nem lista, nem instrução de uso. Ele já viu a confirmação
na tela, então o e-mail é cortesia. Sobram o nome dele, um selo, vaga-lumes
piscando e o botão do convite.

**O relatório do admin** é o oposto, e é para isso que existe: o nome de quem
acabou de responder, os totais, um gráfico de barra empilhada e a lista completa
com vai/não vai, com um selo "AGORA" em quem respondeu por último. Quem recebe é
quem fecha número com buffet, e abrir o `db:studio` a cada resposta não é uma
opção realista. Responder o relatório escreve direto para quem confirmou, porque
o `replyTo` aponta para a conta que respondeu.

A lista vem de `GetGuestRoster`, um caso de uso de leitura consultado na hora de
escrever: o evento é um fato pontual e não carrega o estado atual. Se a consulta
falhar, o relatório sai **sem** o gráfico em vez de não sair, porque saber que
alguém respondeu vale mais que o gráfico.

Uma resposta gera **um** e-mail por caixa de entrada. Quando quem responde é o
próprio admin, o recibo é suprimido e sai só o relatório: dois e-mails sobre o
mesmo fato para o mesmo endereço é spam, e o relatório já diz tudo que o recibo
diria.

O corpo **não repete data, endereço nem traje**, de propósito. E-mail é retrato:
se o local mudar, a caixa de entrada guarda a versão velha para sempre e o
convidado confia nela. O e-mail confirma o fato e aponta para o convite, que é a
fonte da verdade.

Sobre o desenho: o Gmail apaga o `<style>` inteiro e remove SVG, e o Outlook usa
o motor do Word. Então todo enfeite é HTML puro (círculo é `border-radius`,
gráfico é `<td>` com largura em porcentagem), todo gradiente vem com `bgcolor` de
reserva, e as animações do `<style>` são bônus para Apple Mail: o desenho fica
completo sem elas.

Nada disso bloqueia a resposta. O envio acontece depois que a tela já confirmou,
via `after()` do Next. Sem `IVY_MESSAGER_TOKEN` o convite segue aceitando
confirmações e nenhum e-mail sai, porque notificar é melhoria, não requisito.

### Testar com envio real

```bash
npm run email:smoke
```

Exercita o código de produção contra o serviço: o mesmo adapter, o mesmo
publisher, os mesmos templates e os mesmos eventos de domínio que a Server Action
usa. Um `curl` provaria que o serviço funciona; isto prova que a **integração**
funciona, que é a pergunta útil.

**Manda um e-mail de verdade**: o relatório com o gráfico cheio e a lista longa,
que é a única peça que precisa de olho humano. O health check e o caso de
credencial errada não enviam nada, e o próprio caso verifica que saiu **uma**
mensagem, não duas.

> Fica fora de `npm run verify` por construção: a suíte normal inclui só
> `*.spec.ts` e esta inclui só `*.live.ts`, então nenhum arquivo casa nos dois.

Mexendo nos templates e querendo ver todos os fluxos na caixa de entrada:

```bash
npm run email:smoke:full
```

Acrescenta comprovante de envio pelo adapter, idempotência (dois envios, um
e-mail), e os fluxos de confirmação e de mudança de ideia, usando a lista real do
banco quando há `DATABASE_URL`. **Manda cinco e-mails de verdade.**

## Scripts

| Comando               | O que faz                                                               |
| --------------------- | ----------------------------------------------------------------------- |
| `npm run dev`         | servidor de desenvolvimento                                             |
| `npm run build`       | build de produção                                                       |
| `npm run verify`      | **typecheck + lint + testes**. Rode antes de todo commit                |
| `npm run typecheck`   | `tsc --noEmit`                                                          |
| `npm run lint`        | ESLint, incluindo a Regra da Dependência entre camadas                  |
| `npm run test`        | Vitest (95 testes, ~3s, sem banco)                                      |
| `npm run test:watch`  | Vitest em watch                                                         |
| `npm run format`      | Prettier                                                                |
| `npm run db:generate` | gera migração a partir do schema Drizzle                                |
| `npm run db:migrate`  | aplica migrações no Neon                                                |
| `npm run db:studio`   | abre o Drizzle Studio. **é aqui que se lê a lista de confirmados hoje** |
| `npm run email:smoke` | **envia um e-mail de verdade** e valida a integração de ponta a ponta   |
| `npm run email:smoke:full` | a bateria toda dos templates. **manda cinco e-mails de verdade**  |
| `npm run db:inspect`  | imprime colunas, índices e contagens do banco, sem dado de convidado    |

---

## Deploy na Vercel

1. Importe o repositório na Vercel (o preset Next.js é detectado automaticamente).
2. Em _Settings → Environment Variables_, adicione nos três ambientes:
   **`DATABASE_URL`** (Neon), **`AUTH_SECRET`**, **`RSVP_DEVICE_SALT`** e as
   credenciais `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`. Para os e-mails,
   `IVY_MESSAGER_TOKEN` e `RSVP_ADMIN_EMAILS`.
3. Volte ao console do Google e acrescente o domínio da Vercel aos URIs de
   redirecionamento. Sem isso o login falha só em produção.
4. Deploy.

Sem `DATABASE_URL`, a aplicação **falha ao subir em produção** de propósito.
melhor um erro de deploy que um convite que aceita respostas e joga fora.

O convite é publicado com `robots: noindex`: é privado, feito para circular por
WhatsApp.

---

## Arquitetura

O código não está organizado por tipo de arquivo, e sim por **Bounded Context** e
depois por **camada**. Dependências apontam sempre para dentro, e isso é
verificado pelo ESLint. Não é convenção, é build.

```
src/
├── app/                    Next.js App Router. Só composição de página
├── contexts/
│   ├── rsvp/               ◀ CORE: domain · application · infrastructure · presentation
│   └── celebration/        ◀ SUPPORTING: dados da festa (config + ACL de mapas)
├── shared/                 kernel DDD, portas técnicas, adapters, dublês de teste
├── graphics/               lago WebGL (R3F + GLSL) e a cena que acompanha o scroll
└── ui/                     cn, Reveal, HeroTitle, hooks de ambiente, glifos SVG
```

Leitura recomendada, nesta ordem:

| Documento                                                         |                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| [Arquitetura](./docs/architecture/README.md)                      | contextos, camadas, fluxo de uma confirmação, estratégia de testes |
| [Ubiquitous Language](./docs/architecture/ubiquitous-language.md) | glossário PT-BR ↔ código                                           |
| [Agregados e invariantes](./docs/architecture/aggregates.md)      | Event Storming e as 12 invariantes                                 |
| [ADRs](./docs/architecture/adr)                                   | as 13 decisões que sustentam o resto                               |
| [Processo Agile](./docs/agile/README.md)                          | visão, personas, backlog, DoR, DoD, Sprint 1                       |

### Em uma frase, por camada

- **domain**. Regras. Não sabe que existe React, Next, Postgres ou Zod.
- **application**. Casos de uso. Orquestra o domínio através de portas.
- **infrastructure**. Adapters. Neon, config da festa, links de mapa, e o
  Composition Root (único lugar com `new` de implementação concreta).
- **presentation**. React, Server Actions, CSS. Traduz intenção do usuário em
  comando e resultado em pixel.

---

## Acessibilidade e performance (o que já está garantido)

- funciona **sem JavaScript**: o RSVP é um `<form>` real com Server Action
- `prefers-reduced-motion` respeitado em CSS, Motion, confete, WebGL **e** na cena
  de scroll (trilha, vaga-lume e pétalas nem são montados)
- WebGL não monta em aparelho fraco; o gradiente CSS é o estado base
- nenhum emoji de teclado: todo ícone é SVG do tema, `aria-hidden`, sempre
  acompanhado de rótulo em texto
- alvos de toque ≥ 52px, coluna única, `100svh`, safe areas de notch
- pinch-zoom nunca bloqueado
- página estática; mapa e confete carregam sob demanda
- nenhuma API key exposta ao navegador
