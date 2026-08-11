# ADR-0012 — Nenhum emoji de teclado na interface

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

A primeira versão do convite usava emoji como ícone: coroa e coração verde nas
opções do formulário, mapa e carro nos botões de navegação, coroa e sapo no
título de compartilhamento.

Emoji é rápido de escrever e caro de manter:

- **muda de desenho por plataforma.** A coroa do Android não é a do iOS nem a do
  Windows. O convite tem paleta definida (ouro de vela, blush de princesa) e o
  emoji ignora toda ela;
- **é texto, não ilustração.** Herda tamanho de fonte, não aceita gradiente, não
  anima e não reage a estado;
- **denuncia improviso.** Num convite que investe em WebGL e tipografia, um emoji
  de teclado ao lado da opção "Eu vou!" é a peça que faz o conjunto parecer
  rascunho.

## Decisão

Nenhum emoji na interface. Cada um foi substituído por um glifo SVG inline em
`src/ui/ornaments/Glyphs.tsx`:

| Antes | Depois                              | Onde                  |
| ----- | ----------------------------------- | --------------------- |
| 👑    | `CrownGlyph`                        | opção "Eu vou!"       |
| 💚    | `LilyGlyph` (vitória-régia em flor) | opção "Não vou poder" |
| 🗺️    | `MapPinGlyph`                       | botão do Google Maps  |
| 🚗    | `NavigationGlyph`                   | botão do Waze         |
| 👑🐸  | texto                               | título de Open Graph  |

Ganho concreto além da estética: os glifos **reagem**. O da opção escolhida
cresce, se inclina e ganha opacidade total via `peer-checked:[&>svg]:…`, o que dá
confirmação visual sem depender do `input[type=radio]` nativo — que cada sistema
desenha de um jeito. O alfinete de mapa sobe ao toque; a seta do Waze avança.

**Escopo:** vale para a interface. Na documentação, marcadores funcionais de
tabela (✅ pronto, 📋 refinado, 💭 ideia, ⚠️ bloqueio) continuam, porque ali são
legenda e não decoração — e o leitor é o time, não o convidado. O único emoji que
sobrou em `src/` está num fixture de teste, provando que `GuestName` **rejeita**
emoji.

## Consequências

**Boas:** ícone idêntico em toda plataforma; herda a paleta via `currentColor`;
escala nítido em qualquer densidade; anima por CSS; nenhuma requisição de fonte
de emoji.

**Ruins:**

- **cada ícone novo é trabalho de desenho**, não um caractere colado. É o custo
  aceito, e a barreira que mantém a consistência;
- SVG inline pesa mais que um caractere no HTML — irrelevante nesta escala
  (12 SVGs no documento inteiro, todos com poucos paths);
- glifos autorais podem ser menos reconhecíveis que o emoji correspondente. Por
  isso todos vêm **acompanhados de rótulo em texto** ("Abrir no Google Maps",
  "Eu vou!") e são `aria-hidden`: o ícone reforça, nunca informa sozinho.

## Alternativas consideradas

| Alternativa                                  | Por que não                                                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Biblioteca de ícones (Lucide, Heroicons)     | Consistente e pronta, mas nenhuma tem vitória-régia ou coroa de conto de fadas — o convite ficaria com ícones de painel administrativo.         |
| Fonte de emoji própria (Twemoji, Noto Emoji) | Resolve a inconsistência entre plataformas, mas continua sem gradiente, sem animação e adiciona download de fonte.                              |
| Manter os emoji                              | O ponto de partida, e o que o feedback rejeitou explicitamente.                                                                                 |
| Simplesmente remover sem substituir          | Era a alternativa aceitável se o desenho não funcionasse; os cartões de opção ficariam corretos mas sem confirmação visual do que está marcado. |
