# ADR-0005. Stack de gráficos: React Three Fiber + Motion, com degradação em 3 níveis

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

O pedido é explícito: usar os melhores frameworks para gráficos, animação e
estilização. O tema é "A Princesa e o Sapo". Um lago encantado ao anoitecer,
com vitórias-régias e vaga-lumes.

O conflito é igualmente explícito: **o público é 100% mobile**, incluindo
celulares antigos em rede 4G. Uma cena WebGL mal calibrada transforma um convite
em uma página que esquenta o aparelho e não rola.

## Decisão

Três ferramentas, cada uma no que faz melhor:

| Camada         | Ferramenta                                | Escopo                                                         |
| -------------- | ----------------------------------------- | -------------------------------------------------------------- |
| Estilização    | **Tailwind CSS v4** (CSS-first, `@theme`) | design tokens em `globals.css`; nenhum hex solto em componente |
| Animação de UI | **Motion** (`motion/react`)               | revelação por scroll, troca formulário↔selo, mola do selo real |
| Cena 3D        | **React Three Fiber + GLSL cru**          | lago: água, vitórias-régias, vaga-lumes                        |
| Comemoração    | **canvas-confetti**                       | só ao confirmar presença, carregado sob demanda                |
| Scroll         | **Lenis**                                 | inércia em ponteiro/roda; `syncTouch: false` no toque          |

### Orçamento de performance (o que torna a decisão viável)

- **1 draw call para a água**: um único quad em tela cheia; toda a atmosfera é
  aritmética no fragment shader. Sem textura, sem luz, sem post-processing.
- **1 draw call para os vaga-lumes**: `THREE.Points` com deriva e piscada
  calculadas na GPU a partir de atributos por partícula. A CPU atualiza um
  `uTime` por frame.
- **`dpr` limitado a 1.6**: nitidez retina é invisível num gradiente suave e
  custa 4× os fragmentos.
- **`frameloop: 'never'` com a aba em background**: celular no bolso não gasta
  bateria.
- **fbm com 3 octaves**, não 5.
- **Confete e mapa carregados sob demanda** (`import()` dinâmico e
  `loading="lazy"`).

### Degradação progressiva em 3 níveis

| Nível | Condição                                                  | O que o convidado vê                                     |
| ----- | --------------------------------------------------------- | -------------------------------------------------------- |
| 1     | SSR / JS desabilitado                                     | gradiente radial CSS. Zero byte de WebGL.                |
| 2     | `prefers-reduced-motion` **ou** `hardwareConcurrency ≤ 2` | o mesmo gradiente, canvas nunca monta, confete desligado |
| 3     | demais dispositivos                                       | lago animado completo                                    |

O nível 1 é o **estado base**, sempre pintado atrás do canvas. Não é fallback de
erro, é a camada de baixo. As capacidades são lidas via `useSyncExternalStore`
(`src/ui/hooks/use-environment.ts`), o que dá um snapshot de servidor explícito e
evita flash de hidratação.

A cena é `aria-hidden`, `pointer-events-none` e nunca carrega informação que não
esteja escrita no DOM.

## Consequências

**Boas:** o convite tem identidade visual real, sem custo para quem não pode
pagar por ela; a cena inteira são ~200 linhas de TSX + GLSL, sem asset binário;
`prefers-reduced-motion` é respeitado no CSS, no Motion, no confete e no WebGL.

**Ruins:**

- `three` é a maior dependência do projeto (~600KB min+gzip no chunk do cliente);
  aceito porque o chunk carrega **depois** do conteúdo e nunca em nível 1 a 2;
- GLSL cru não tem checagem de tipo nem teste automatizado. Quebra visual só
  aparece em revisão manual (item no [DoD](../../agile/definition-of-done.md));
- `hardwareConcurrency` é um proxy grosseiro de "aparelho fraco". Erra para o
  lado seguro.

## Alternativas consideradas

| Alternativa                 | Por que não                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Só CSS/SVG animado          | Mais leve, mas o lago com vaga-lumes e ondulação não sai crível. E a marca visual era requisito.                                   |
| Lottie / vídeo de fundo     | Asset binário grande, sem reação a viewport, e vídeo em autoplay é hostil em 4G.                                                   |
| GSAP em vez de Motion       | Excelente, porém imperativo; Motion integra com o ciclo de vida do React e com `AnimatePresence`, que a troca formulário↔selo usa. |
| `@react-three/drei`         | Instalado e removido: nenhum helper era necessário depois de escrever os shaders, e dependência sem uso é dívida.                  |
| `@vis.gl/react-google-maps` | Exigiria API key e SDK JS no caminho crítico. Ver [ADR-0006](./0006-google-maps-sem-api-key.md).                                   |
