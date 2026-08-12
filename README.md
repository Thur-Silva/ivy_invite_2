# Convite da Ivy. 2 anos

Convite digital, mobile-first, para o aniversário de 2 anos da Ivy. Tema: **A
Princesa e o Sapo**.

Uma página, quatro atos: lago encantado → introdução e data → confirmação de
presença → como chegar.

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
npm run db:migrate             # aplica drizzle/0000_create_rsvps.sql
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

## Scripts

| Comando               | O que faz                                                               |
| --------------------- | ----------------------------------------------------------------------- |
| `npm run dev`         | servidor de desenvolvimento                                             |
| `npm run build`       | build de produção                                                       |
| `npm run verify`      | **typecheck + lint + testes**. Rode antes de todo commit                |
| `npm run typecheck`   | `tsc --noEmit`                                                          |
| `npm run lint`        | ESLint, incluindo a Regra da Dependência entre camadas                  |
| `npm run test`        | Vitest (32 testes, ~1s, sem banco)                                      |
| `npm run test:watch`  | Vitest em watch                                                         |
| `npm run format`      | Prettier                                                                |
| `npm run db:generate` | gera migração a partir do schema Drizzle                                |
| `npm run db:migrate`  | aplica migrações no Neon                                                |
| `npm run db:studio`   | abre o Drizzle Studio. **é aqui que se lê a lista de confirmados hoje** |

---

## Deploy na Vercel

1. Importe o repositório na Vercel (o preset Next.js é detectado automaticamente).
2. Em _Settings → Environment Variables_, adicione **`DATABASE_URL`** com a
   string do Neon, nos três ambientes.
3. Deploy.

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
| [ADRs](./docs/architecture/adr)                                   | as 12 decisões que sustentam o resto                               |
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
