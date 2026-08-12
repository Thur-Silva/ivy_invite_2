'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

/**
 * O jacaré do lago — desenho original, no estilo do resto do convite.
 *
 * ## O vaga-lume mora aqui dentro. De propósito.
 *
 * Esta é a decisão central do componente. Antes, o vaga-lume era um elemento
 * `fixed` na viewport e a boca vivia numa seção do documento: dois sistemas de
 * coordenadas diferentes, unidos por conversões entre `vh`, `%` e progresso de
 * scroll. Cada conversão era uma chance de errar — e errava, em resoluções
 * diferentes e em telas móveis onde `vh` e `svh` divergem.
 *
 * Agora o vaga-lume que é engolido é um `<g>` **deste mesmo SVG**, voando até a
 * boca em `(60, 94)` do viewBox. Os dois estão no mesmo espaço vetorial: se o
 * SVG escala, os dois escalam juntos. O encontro é exato em qualquer resolução,
 * qualquer altura de página, qualquer aparelho — não por calibragem, mas porque
 * não existe conversão nenhuma entre eles.
 *
 * O vaga-lume da trilha (camada de fundo) apenas se apaga um pouco antes, e este
 * entra em quadro vindo de fora do viewBox. A troca acontece fora da tela.
 *
 * ## Anatomia: tudo se sobrepõe, nada encosta
 *
 * Membro desenhado *ao lado* do corpo lê como adesivo colado. Cada peça nasce
 * **dentro** do tronco e sai dele; a ordem de pintura é cauda e membros de trás,
 * tronco por cima cobrindo as junções, membros da frente, cabeça por último.
 *
 * ## Contraste com o lago
 *
 * Fundo verde-escuro engole jacaré verde-escuro. Paleta deslocada para o claro,
 * **contorno** escuro em toda silhueta — o truque clássico de desenho animado — e
 * um halo escuro difuso atrás, que o descola da água.
 *
 * ## Como a boca abre
 *
 * Crânio e olhos **não giram** — se girassem, os olhos desceriam com o focinho e
 * o rosto desmontaria. Giram só as duas maxilas, na mesma dobradiça escondida: a
 * de cima sobe pouco, a de baixo desce muito.
 */

const OUTLINE = '#223D28';
const LIMB = '#6E9A5F';
const LIMB_BACK = '#4E7047';

/** Onde a goela abre, em unidades do viewBox. O vaga-lume termina aqui. */
const MOUTH = { x: 60, y: 94 } as const;

export function PondGator({
  jawOpen,
  approach,
  fireflyOpacity,
  bellyGlow,
  gulp,
}: {
  /** 0 = boca fechada, 1 = escancarada. */
  jawOpen: MotionValue<number>;
  /** 0 = vaga-lume fora de quadro, 1 = dentro da boca. */
  approach: MotionValue<number>;
  fireflyOpacity: MotionValue<number>;
  bellyGlow: MotionValue<number>;
  gulp: MotionValue<number>;
}) {
  /*
   * Atenção ao sinal. Em SVG o eixo Y aponta para **baixo**, então rotação
   * positiva (horária na tela) *levanta* a ponta de um focinho voltado para a
   * esquerda, e negativa a abaixa — o contrário da intuição cartesiana. Inverter
   * isto abre a boca ao avesso.
   */
  const upperJawRotate = useTransform(jawOpen, [0, 1], [0, 15]);
  const lowerJawRotate = useTransform(jawOpen, [0, 1], [0, -28]);
  const tongueRotate = useTransform(jawOpen, [0, 1], [0, -24]);

  // Trajeto do vaga-lume: entra de fora do viewBox, pelo alto à esquerda, e
  // termina exatamente sobre a boca. Deslocamento zero = dentro da goela.
  const fireflyX = useTransform(approach, [0, 1], [-104, 0]);
  const fireflyY = useTransform(approach, [0, 1], [-112, 0]);
  const fireflyScale = useTransform(approach, [0, 1], [1.2, 0.75]);

  const bloomOpacity = useTransform(bellyGlow, [0, 1], [0, 0.85]);

  return (
    <svg viewBox="0 0 240 220" role="presentation" aria-hidden="true" className="h-auto w-full">
      <defs>
        <linearGradient id="gator-skin" x1="0.25" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#B7CE9C" />
          <stop offset="45%" stopColor="#87AC6E" />
          <stop offset="100%" stopColor="#557B49" />
        </linearGradient>
        <linearGradient id="gator-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F2E4C9" />
          <stop offset="100%" stopColor="#D8C3A5" />
        </linearGradient>
        <radialGradient id="gator-firefly-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFDF5" stopOpacity="1" />
          <stop offset="35%" stopColor="#FFE9A8" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#F3D68F" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#E9C46A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gator-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#04140F" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#04140F" stopOpacity="0" />
        </radialGradient>
        <filter id="gator-bloom" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="gator-spark-bloom" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Halo escuro: descola o bicho da água sem borda dura */}
      <ellipse cx="124" cy="146" rx="116" ry="94" fill="url(#gator-halo)" />

      {/* ---- Peças de trás: nascem dentro do tronco ---------------------- */}

      <path
        d="M150 152 C196 158 222 130 216 98 C213 82 194 80 191 96 C187 118 176 132 150 134 Z"
        fill={LIMB_BACK}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M164 158 C176 176 178 188 174 196"
        stroke={LIMB_BACK}
        strokeWidth="26"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="178"
        cy="198"
        rx="22"
        ry="10"
        fill={LIMB_BACK}
        stroke={OUTLINE}
        strokeWidth="3"
      />

      {/* ---- Tronco: pintado por cima, cobre todas as junções ------------ */}

      <motion.g style={{ scale: gulp, transformBox: 'fill-box', transformOrigin: 'center' }}>
        <ellipse
          cx="130"
          cy="140"
          rx="60"
          ry="55"
          fill="url(#gator-skin)"
          stroke={OUTLINE}
          strokeWidth="3.5"
        />

        <ellipse
          cx="124"
          cy="150"
          rx="44"
          ry="41"
          fill="url(#gator-belly)"
          stroke={OUTLINE}
          strokeWidth="2"
          strokeOpacity="0.35"
        />
        <path
          d="M86 136 H162 M83 152 H165 M88 170 H158"
          stroke="#B79E78"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* O vaga-lume aceso lá dentro. Três camadas — bloom, núcleo e estouro
            branco — é o que faz a barriga realmente acender. */}
        <motion.circle
          cx="124"
          cy="150"
          r="42"
          fill="#FFE9A8"
          filter="url(#gator-bloom)"
          style={{ opacity: bloomOpacity }}
        />
        <motion.circle
          cx="124"
          cy="150"
          r="40"
          fill="url(#gator-firefly-glow)"
          style={{ opacity: bellyGlow }}
        />
        <motion.circle
          cx="124"
          cy="150"
          r="11"
          fill="#FFFDF5"
          filter="url(#gator-bloom)"
          style={{ opacity: bellyGlow }}
        />
      </motion.g>

      {/* ---- Braços: os dois em repouso, sem instrumento ----------------- */}

      <path
        d="M100 124 C84 138 84 154 94 162"
        stroke={LIMB}
        strokeWidth="17"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="97" cy="164" rx="11" ry="9" fill={LIMB} stroke={OUTLINE} strokeWidth="2.5" />

      <path
        d="M166 126 C174 142 170 156 160 162"
        stroke={LIMB}
        strokeWidth="17"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="157" cy="164" rx="11" ry="9" fill={LIMB} stroke={OUTLINE} strokeWidth="2.5" />

      {/* Perna da frente */}
      <path
        d="M108 162 C98 180 94 190 94 196"
        stroke={LIMB}
        strokeWidth="24"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="92" cy="198" rx="22" ry="10" fill={LIMB} stroke={OUTLINE} strokeWidth="3" />

      {/* ---- Cabeça: invade o tronco, sem emenda no pescoço -------------- */}

      <path d="M102 80 C74 84 42 88 24 86 L24 104 C50 112 82 110 102 106 Z" fill="#7E2D3F" />
      <motion.path
        d="M96 92 C74 96 48 100 32 98 C48 106 76 106 96 102 Z"
        fill="#D8788E"
        style={{ rotate: tongueRotate, transformBox: 'fill-box', transformOrigin: '100% 0%' }}
      />

      {/* Maxila inferior — desce bastante */}
      <motion.g
        style={{ rotate: lowerJawRotate, transformBox: 'fill-box', transformOrigin: '100% 0%' }}
      >
        <path
          d="M102 90 C78 93 46 95 27 92 C17 90 15 102 27 105 C52 111 82 110 102 107 Z"
          fill="url(#gator-skin)"
          stroke={OUTLINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M36 95 l4.5 -8 l4.5 8 M56 97 l4.5 -8 l4.5 8 M76 98 l4.5 -8 l4.5 8"
          fill="#FFFDF5"
        />
      </motion.g>

      {/* Maxila superior — sobe pouco, mesma dobradiça */}
      <motion.g
        style={{ rotate: upperJawRotate, transformBox: 'fill-box', transformOrigin: '100% 100%' }}
      >
        <path
          d="M102 66 C76 56 42 56 25 67 C15 73 16 84 26 85 C52 88 82 88 102 88 Z"
          fill="url(#gator-skin)"
          stroke={OUTLINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M34 85 l4.5 8 l4.5 -8 M54 86 l4.5 8 l4.5 -8 M74 87 l4.5 8 l4.5 -8"
          fill="#FFFDF5"
        />
        <circle cx="27" cy="70" r="2.6" fill={OUTLINE} />
        <circle cx="36" cy="66" r="2.6" fill={OUTLINE} />
      </motion.g>

      {/* Crânio e olhos: PARADOS */}
      <path
        d="M96 60 C112 56 130 64 134 80 C137 94 128 104 112 104 C100 104 94 96 94 86 Z"
        fill="url(#gator-skin)"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse
        cx="98"
        cy="52"
        rx="15"
        ry="14"
        fill="url(#gator-skin)"
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <ellipse
        cx="123"
        cy="56"
        rx="13"
        ry="12"
        fill="url(#gator-skin)"
        stroke={OUTLINE}
        strokeWidth="3"
      />
      <circle cx="98" cy="50" r="7.5" fill="#FFFDF5" />
      <circle cx="123" cy="54" r="6.5" fill="#FFFDF5" />
      <circle cx="99.5" cy="51" r="3.6" fill="#0B2E23" />
      <circle cx="124.5" cy="55" r="3.2" fill="#0B2E23" />
      <circle cx="101" cy="48.5" r="1.5" fill="#FFFDF5" />
      <circle cx="126" cy="52.5" r="1.3" fill="#FFFDF5" />

      {/*
        O VAGA-LUME. Último na ordem de pintura, então voa na frente de tudo até
        entrar na goela. Deslocamento zero = exatamente sobre MOUTH.
      */}
      <motion.g
        style={{
          x: fireflyX,
          y: fireflyY,
          scale: fireflyScale,
          opacity: fireflyOpacity,
          transformBox: 'fill-box',
          transformOrigin: 'center',
        }}
      >
        <circle
          cx={MOUTH.x}
          cy={MOUTH.y}
          r="13"
          fill="#FFE9A8"
          opacity="0.5"
          filter="url(#gator-spark-bloom)"
        />
        <circle cx={MOUTH.x} cy={MOUTH.y} r="4.2" fill="#FFFDF5" />
      </motion.g>
    </svg>
  );
}
