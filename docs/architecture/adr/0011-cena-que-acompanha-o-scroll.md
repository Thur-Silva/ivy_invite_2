# ADR-0011 — Camada de cena que acompanha o scroll

- **Status:** aceito
- **Data:** 2026-08-11
- **Complementa:** [ADR-0005](./0005-stack-de-graficos-e-animacao.md)

## Contexto

O lago WebGL entregue no Sprint 1 é um **fundo**: bonito, mas imóvel em relação
à leitura. Rolando a página, nada acontece além de seções aparecendo uma a uma.
O convite tinha atmosfera e não tinha **narrativa**.

O pedido foi explícito: algo que acompanhe o convidado do início ao fim da
página, com eventos acontecendo durante a rolagem, e o frontend como ponto forte
do sistema.

O desafio técnico não é animar — é **ancorar**. Um elemento que "desce junto com
o scroll" precisa existir em espaço de viewport (fixo, para estar sempre visível)
enquanto o caminho que ele percorre existe em espaço de documento (rola com o
conteúdo). Alinhar os dois normalmente vira medição em runtime, `ResizeObserver`
e números mágicos por breakpoint.

## Decisão

Uma camada `src/graphics/scroll-journey/` com três peças que compartilham **uma
única função de curva** (`curveX(t)` em `trail-path.ts`):

| Peça               | Espaço    | O que faz                                                                                                          |
| ------------------ | --------- | ------------------------------------------------------------------------------------------------------------------ |
| Trilha             | documento | caminho sinuoso que se **desenha** conforme a leitura avança (`pathLength` ligado ao progresso de scroll)          |
| Marcadores         | documento | vitórias-régias que acendem, giram e disparam um anel de água ao serem ultrapassadas; coroa como recompensa no fim |
| Vaga-lume + rastro | viewport  | desce junto com a rolagem, exatamente sobre a trilha, com três faíscas em molas mais moles atrás dele              |

### O alinhamento é matemático, não medido

Com a trilha ocupando toda a altura do documento e `preserveAspectRatio="none"`,
o ponto da curva na fração `t` fica em `y_documento = t·H`. Rolando com progresso
`p` (onde `t = p`), temos `scrollY = p·(H − vh)`, logo:

```
y_viewport = p·H − p·(H − vh) = p · vh
```

Basta posicionar o vaga-lume em `top: p·100vh` e `left: curveX(p)%` para ele cair
sobre a trilha — sem medir nada, sem observer, sem ajuste por breakpoint.

### Detalhes que a decisão obriga

- **`vector-effect="non-scaling-stroke"`** na trilha. Sem isso, o `viewBox`
  esticado para milhares de pixels de altura deformaria a espessura do traço.
- **Glow por dois traços empilhados** (um largo translúcido, um fino brilhante)
  em vez de filtro SVG: `feGaussianBlur` sob escala não uniforme desfoca de forma
  assimétrica.
- **Progresso passa por `useSpring`** antes de virar posição. É a diferença entre
  um ponto amarrado ao scroll e um bicho voando: ele ultrapassa um pouco ao parar
  e volta.
- **`z-index: -1`** na camada inteira, então os cartões com `backdrop-filter` a
  capturam desfocada por trás do vidro — o efeito sai de graça.
- **Marcadores em posições fixas** (0.26 / 0.52 / 0.78 do documento) em vez de
  medidas das seções: a página tem altura previsível e observers não mudariam
  nada visualmente.

### Camada de pétalas com parallax

`DriftingPetals` fica em `z-index: -2`, entre o lago e a trilha, com velocidade
proporcional a um `depth` por pétala. Dá profundidade sem um segundo canvas.

## Consequências

**Boas:**

- a rolagem passa a ter começo, meio e fim: trilha se desenhando, marcadores
  disparando, coroa no final;
- custo baixo — SVG, `transform` e `opacity`, tudo em propriedades que o
  compositor resolve sem relayout;
- nenhuma medição em runtime, então nada quebra em redimensionamento ou rotação
  de tela;
- desliga inteiro em `prefers-reduced-motion` (retorna `null`, nem monta).

**Ruins:**

- **a camada não existe no HTML do servidor.** `usePrefersReducedMotion` devolve
  `true` como snapshot de servidor, então a cena só aparece após a hidratação.
  Aceito: é decoração, e o alternativo seria arriscar um flash de movimento em
  quem pediu para não ter movimento;
- **o alinhamento assume que `main` tem a altura do documento.** O
  `padding-bottom` de safe area no `body` introduz alguns pixels de desvio em
  celulares com notch. Invisível numa trilha de traço suave, mas é uma premissa;
- **`left` em % de um elemento fixo** é % da viewport, não do container. Coincide
  hoje porque `main` é full-width; em desktop com barra de rolagem visível há um
  desvio de poucos pixels;
- mais uma camada para raciocinar sobre empilhamento — documentada no comentário
  de `page.tsx`.

## Alternativas consideradas

| Alternativa                                             | Por que não                                                                                                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Colocar o companheiro dentro do canvas WebGL            | Precisaria projetar coordenadas de scroll para espaço 3D e desapareceria nos níveis 1–2 da degradação, justamente onde a página fica mais sem vida.                                                                                        |
| `position: sticky` numa coluna lateral                  | Simples, mas o elemento fica preso a uma faixa e não percorre um caminho — perde a ideia de jornada.                                                                                                                                       |
| Medir as seções com `IntersectionObserver` e interpolar | Funciona, mas troca uma dedução exata por medição, observers e estado — mais código para o mesmo pixel.                                                                                                                                    |
| Scroll-driven animations em CSS (`animation-timeline`)  | Zero JavaScript e muito elegante, porém suporte ainda irregular no Safari iOS, que é a maioria do público.                                                                                                                                 |
| Sapo pulando entre vitórias-régias                      | Foi a primeira ideia e é mais literal ao tema, mas exige coreografia de pulo crível a qualquer velocidade de rolagem. O vaga-lume voa bem em qualquer velocidade, e o sapo já é protagonista da seção do convite e do selo de confirmação. |
