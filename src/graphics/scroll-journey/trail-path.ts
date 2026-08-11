/**
 * Geometria da trilha que atravessa o convite de cima a baixo.
 *
 * Uma única função define a curva, e ela é consumida por três coisas diferentes:
 * o `<path>` SVG em espaço de documento, o vaga-lume em espaço de viewport, e os
 * marcadores das seções. Compartilhar a matemática é o que garante que o
 * vaga-lume voe exatamente **sobre** a trilha, e não perto dela.
 *
 * Por que isso alinha de forma exata:
 *
 *   Com a trilha ocupando toda a altura do documento e `preserveAspectRatio="none"`,
 *   o ponto da curva na fração `t` do documento fica em `y_documento = t · H`.
 *   Rolando com progresso `p`, temos `scrollY = p · (H − vh)` e `t = p`, logo:
 *
 *       y_viewport = p·H − p·(H − vh) = p · vh
 *
 *   Ou seja: basta posicionar o vaga-lume em `top: p · 100vh` e ele cai
 *   matematicamente sobre a trilha, sem medir nada em runtime.
 */

/** Posição horizontal da trilha, em % da largura, para `t` ∈ [0, 1]. */
export function curveX(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  // 1,55 ciclos ao longo da página, com amplitude decrescendo até o final —
  // a trilha "se acalma" quando chega no encerramento.
  return 50 + 27 * Math.sin(clamped * Math.PI * 3.1) * (1 - 0.22 * clamped);
}

/**
 * Monta o atributo `d` da trilha num viewBox de 100×100.
 *
 * 180 amostras: densidade suficiente para a curva parecer contínua mesmo
 * esticada para milhares de pixels de altura, e barata o bastante para ser
 * calculada uma única vez na carga do módulo.
 */
export function buildTrailPath(samples = 180): string {
  const commands: string[] = [];

  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const x = curveX(t).toFixed(3);
    const y = (t * 100).toFixed(3);
    commands.push(`${index === 0 ? 'M' : 'L'} ${x} ${y}`);
  }

  return commands.join(' ');
}

/**
 * Frações do documento onde a trilha ganha um marcador.
 *
 * Aproximam o início de cada ato do convite (introdução, presença, local). São
 * valores fixos em vez de medidos: a página tem altura previsível, e medir
 * posições de seção exigiria observers para um ganho visual nulo.
 */
export const TRAIL_STOPS = [0.22, 0.42, 0.62, 0.8] as const;

/*
 * Nota histórica: aqui havia uma constante `TRAIL_FINALE` que plantava o jacaré
 * numa fração fixa da altura do documento. A dedução era exata, mas assumia o
 * layout — bastou a página ganhar a seção do traje para o cartão do mapa cair em
 * cima dele.
 *
 * O jacaré passou a viver em `GatorStageSection`, uma seção real que reserva o
 * próprio espaço, e o instante da mordida vem da medição dessa seção
 * (`gator-stage.tsx`). Não recrie uma fração mágica aqui.
 */
