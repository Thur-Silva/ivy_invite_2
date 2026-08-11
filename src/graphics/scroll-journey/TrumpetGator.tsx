'use client';

import { motion, type MotionValue } from 'motion/react';

/**
 * O jacaré trompetista do lago — desenho original, no estilo do resto do convite.
 *
 * Fica no fim da trilha e **engole o vaga-lume** que acompanhou a leitura. Toda
 * a animação é dirigida por scroll: nada aqui roda sozinho.
 *
 * ## Onde fica a boca
 *
 * O ponto de engolir é `(50, 92)` no viewBox de `200 × 210`, ou seja **25% da
 * largura e 43,8% da altura** da caixa. O componente pai desloca o jacaré por
 * esses mesmos percentuais para que a boca — e não o centro do desenho — caia
 * exatamente sobre o ponto da trilha onde o vaga-lume chega. Mexeu no desenho,
 * mexa em `GATOR_MOUTH_OFFSET`.
 *
 * ## Como a mandíbula abre
 *
 * O maxilar superior é um `<g>` que gira em torno da dobradiça (canto inferior
 * direito do próprio bounding box, via `transform-box: fill-box`). Rotação
 * negativa levanta a ponta do focinho, que aponta para a esquerda.
 */

/** Deslocamento da caixa para que a BOCA fique sobre o ponto de ancoragem. */
export const GATOR_MOUTH_OFFSET = { x: '25%', y: '43.8%' } as const;

export function TrumpetGator({
  jawRotate,
  bellyGlow,
  gulp,
  notesOpacity,
}: {
  jawRotate: MotionValue<number>;
  bellyGlow: MotionValue<number>;
  gulp: MotionValue<number>;
  notesOpacity: MotionValue<number>;
}) {
  return (
    <svg viewBox="0 0 200 210" role="presentation" aria-hidden="true" className="h-auto w-full">
      <defs>
        <linearGradient id="gator-skin" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#8BA888" />
          <stop offset="55%" stopColor="#5F8060" />
          <stop offset="100%" stopColor="#3E5B42" />
        </linearGradient>
        <linearGradient id="gator-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3D68F" />
          <stop offset="55%" stopColor="#E9C46A" />
          <stop offset="100%" stopColor="#C9A227" />
        </linearGradient>
        <radialGradient id="gator-belly-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFF6E8" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#FFE9A8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cauda, atrás do corpo */}
      <path
        d="M134 170 C172 176 196 148 190 114 C188 103 176 102 174 113 C170 132 156 145 132 146 Z"
        fill="#3E5B42"
      />

      {/* Pés */}
      <ellipse cx="74" cy="190" rx="21" ry="11" fill="#3E5B42" />
      <ellipse cx="126" cy="190" rx="21" ry="11" fill="#3E5B42" />

      {/* Braço que segura o trompete */}
      <path
        d="M138 118 C154 106 164 90 168 76"
        stroke="#5F8060"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      <motion.g style={{ scale: gulp, transformBox: 'fill-box', transformOrigin: 'center' }}>
        {/* Barrigão */}
        <ellipse cx="102" cy="142" rx="55" ry="51" fill="url(#gator-skin)" />
        <ellipse cx="98" cy="152" rx="39" ry="38" fill="#D8C3A5" fillOpacity="0.92" />
        <path
          d="M64 140 H132 M62 154 H134 M68 170 H128"
          stroke="#C0A886"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* O vaga-lume aceso lá dentro, depois de engolido */}
        <motion.ellipse
          cx="98"
          cy="152"
          rx="30"
          ry="30"
          fill="url(#gator-belly-glow)"
          style={{ opacity: bellyGlow }}
        />
      </motion.g>

      {/* Braço de apoio */}
      <ellipse cx="54" cy="150" rx="13" ry="21" transform="rotate(-18 54 150)" fill="#5F8060" />

      {/* Interior da boca — visível quando o maxilar sobe */}
      <path d="M96 88 C68 92 38 95 18 92 L18 99 C44 104 72 103 96 100 Z" fill="#8C3B4F" />

      {/* Maxilar inferior, fixo */}
      <path
        d="M96 96 C72 104 40 107 20 101 C13 99 13 92 20 91 C46 87 76 88 96 88 Z"
        fill="#5F8060"
      />
      <path
        d="M30 94 l4 7 l4 -7 M48 93 l4 7 l4 -7 M66 92 l4 7 l4 -7"
        fill="#FFF6E8"
        fillOpacity="0.95"
      />

      {/* Maxilar superior + olhos: gira na dobradiça para abrir a boca */}
      <motion.g
        style={{ rotate: jawRotate, transformBox: 'fill-box', transformOrigin: '100% 100%' }}
      >
        <path
          d="M98 86 C74 76 40 72 20 79 C12 82 12 90 20 90 C46 90 78 92 98 96 Z"
          fill="url(#gator-skin)"
        />
        <path
          d="M32 86 l4 -7 l4 7 M50 84 l4 -7 l4 7 M68 84 l4 -7 l4 7"
          fill="#FFF6E8"
          fillOpacity="0.95"
        />
        {/* Narinas na ponta do focinho */}
        <circle cx="22" cy="82" r="2.2" fill="#3E5B42" />
        <circle cx="30" cy="80" r="2.2" fill="#3E5B42" />
        {/* Olhos saltados, como todo jacaré de desenho */}
        <ellipse cx="82" cy="68" rx="13" ry="12" fill="url(#gator-skin)" />
        <ellipse cx="60" cy="70" rx="11" ry="10" fill="url(#gator-skin)" />
        <circle cx="82" cy="66" r="6.5" fill="#FFF6E8" />
        <circle cx="60" cy="68" r="5.5" fill="#FFF6E8" />
        <circle cx="83.5" cy="67" r="3.2" fill="#0B2E23" />
        <circle cx="61" cy="69" r="2.8" fill="#0B2E23" />
      </motion.g>

      {/* Trompete */}
      <g transform="translate(150 58) rotate(-28)">
        <rect x="0" y="-4" width="24" height="8" rx="4" fill="url(#gator-brass)" />
        <path d="M24 -13 L42 -21 L42 21 L24 13 Z" fill="url(#gator-brass)" />
        <rect x="6" y="-9" width="3.5" height="6" rx="1.7" fill="#C9A227" />
        <rect x="13" y="-9" width="3.5" height="6" rx="1.7" fill="#C9A227" />
      </g>

      {/* Notas musicais — o jacaré comemora a refeição */}
      <motion.g style={{ opacity: notesOpacity }} className="animate-float">
        <g fill="#F3D68F">
          <circle cx="182" cy="30" r="4.5" />
          <rect x="185" y="12" width="2.4" height="20" rx="1.2" />
          <circle cx="162" cy="16" r="3.5" />
          <rect x="164.5" y="2" width="2" height="15" rx="1" />
        </g>
      </motion.g>
    </svg>
  );
}
