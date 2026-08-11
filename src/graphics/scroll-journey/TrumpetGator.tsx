'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

/**
 * O jacaré trompetista do lago — desenho original, no estilo do resto do convite.
 *
 * Fica no fim da trilha e **engole o vaga-lume** que acompanhou a leitura. Toda
 * a animação é dirigida por scroll: nada aqui roda sozinho.
 *
 * ## Anatomia: tudo se sobrepõe, nada encosta
 *
 * Membro desenhado *ao lado* do corpo lê como adesivo colado. Aqui cada peça
 * nasce **dentro** do tronco e sai dele:
 *
 *  - as coxas partem de dentro da elipse do corpo e só depois viram pé;
 *  - os braços partem do ombro, sob a silhueta do tronco;
 *  - a cauda começa 25px dentro do corpo;
 *  - o crânio invade o tronco por ~16px, então não existe emenda no pescoço.
 *
 * A ordem de pintura também importa: cauda e membros de trás primeiro, tronco por
 * cima (cobrindo as junções), membros da frente depois, cabeça por último.
 *
 * ## Contraste com o lago
 *
 * O fundo é verde-escuro, então um jacaré verde-escuro some. Três recursos:
 * paleta deslocada para o claro (sálvia e oliva em vez de musgo), **contorno**
 * escuro em toda silhueta — o truque clássico de desenho animado — e um halo
 * escuro difuso atrás do bicho, que o descola da água.
 *
 * ## Como a boca abre
 *
 * Crânio e olhos **não giram** — se girassem, os olhos desceriam junto com o
 * focinho e o rosto desmontaria. Giram apenas as duas maxilas, em torno da mesma
 * dobradiça escondida dentro do crânio: a de cima sobe pouco, a de baixo desce
 * muito. É assim que jacaré abre a boca de verdade, e é o que faz a mordida ler.
 *
 * ## Onde fica a boca
 *
 * O centro da goela aberta fica em `(60, 94)` no viewBox de `240 × 220` — ver
 * `GATOR_MOUTH_OFFSET` para a conta. O componente pai desloca o jacaré por esses
 * percentuais para que a **boca**, e não o centro do desenho, caia sobre o ponto
 * da trilha onde o vaga-lume chega. Mexeu no desenho, mexa na constante.
 */

/**
 * Deslocamento da caixa para que a BOCA fique sobre o ponto de ancoragem.
 *
 * Conferido girando as duas maxilas na abertura máxima: em `x ≈ 60` a goela vai
 * de `y ≈ 77` a `y ≈ 114`, então `(60, 94)` cai com folga dentro dela.
 */
export const GATOR_MOUTH_OFFSET = { x: '25%', y: '42.5%' } as const;

const OUTLINE = '#223D28';
const LIMB = '#6E9A5F';
const LIMB_BACK = '#4E7047';

export function TrumpetGator({
  jawOpen,
  bellyGlow,
  gulp,
  notesOpacity,
}: {
  /** 0 = boca fechada, 1 = escancarada. */
  jawOpen: MotionValue<number>;
  bellyGlow: MotionValue<number>;
  gulp: MotionValue<number>;
  notesOpacity: MotionValue<number>;
}) {
  /*
   * Uma abertura, duas maxilas: a de baixo faz o grosso do movimento.
   *
   * Atenção ao sinal. Em SVG o eixo Y aponta para **baixo**, então uma rotação
   * positiva (horária na tela) *levanta* a ponta de um focinho voltado para a
   * esquerda, e uma negativa a abaixa — o contrário da intuição de plano
   * cartesiano. Inverter isto abre a boca ao avesso.
   */
  const upperJawRotate = useTransform(jawOpen, [0, 1], [0, 15]);
  const lowerJawRotate = useTransform(jawOpen, [0, 1], [0, -28]);
  // A língua acompanha a mandíbula, senão fica flutuando na goela.
  const tongueRotate = useTransform(jawOpen, [0, 1], [0, -24]);
  // O brilho externo é mais generoso que o interno: é o que faz "acender".
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
        <linearGradient id="gator-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7E3AE" />
          <stop offset="55%" stopColor="#E9C46A" />
          <stop offset="100%" stopColor="#B8901F" />
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
        <filter id="gator-bloom" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* Halo escuro: descola o bicho da água sem precisar de borda dura */}
      <ellipse cx="128" cy="146" rx="118" ry="96" fill="url(#gator-halo)" />

      {/* ---- Peças de trás: nascem dentro do tronco ---------------------- */}

      {/* Cauda — começa 25px dentro do corpo, some sob ele */}
      <path
        d="M150 152 C196 158 222 130 216 98 C213 82 194 80 191 96 C187 118 176 132 150 134 Z"
        fill={LIMB_BACK}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Perna de trás: coxa sai de dentro do tronco, depois o pé */}
      <path
        d="M164 158 C176 176 178 188 174 196"
        stroke={LIMB_BACK}
        strokeWidth="26"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M164 158 C176 176 178 188 174 196"
        stroke={OUTLINE}
        strokeWidth="30"
        strokeLinecap="round"
        fill="none"
        opacity="0.28"
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

      {/* Braço erguido com o trompete — sai do ombro, por trás do tronco */}
      <path
        d="M170 116 C192 100 202 84 204 70"
        stroke={LIMB_BACK}
        strokeWidth="19"
        strokeLinecap="round"
        fill="none"
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

        {/* Barriga */}
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

        {/* O vaga-lume aceso lá dentro. Três camadas: bloom externo, núcleo e
            estouro branco — é o que faz a barriga acender de verdade. */}
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

      {/* ---- Peças da frente --------------------------------------------- */}

      {/* Perna da frente */}
      <path
        d="M108 162 C98 180 94 190 94 196"
        stroke={LIMB}
        strokeWidth="24"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="92" cy="198" rx="22" ry="10" fill={LIMB} stroke={OUTLINE} strokeWidth="3" />

      {/* Braço apoiado na barriga */}
      <path
        d="M100 124 C84 138 84 154 94 162"
        stroke={LIMB}
        strokeWidth="17"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="97" cy="164" rx="11" ry="9" fill={LIMB} stroke={OUTLINE} strokeWidth="2.5" />

      {/* ---- Cabeça: invade o tronco, então não há emenda no pescoço ----- */}

      {/* Goela, atrás das maxilas */}
      <path d="M102 80 C74 84 42 88 24 86 L24 104 C50 112 82 110 102 106 Z" fill="#7E2D3F" />
      <motion.path
        d="M96 92 C74 96 48 100 32 98 C48 106 76 106 96 102 Z"
        fill="#D8788E"
        style={{ rotate: tongueRotate, transformBox: 'fill-box', transformOrigin: '100% 0%' }}
      />

      {/* Maxila inferior — desce bastante; dobradiça no topo-direita */}
      <motion.g
        style={{
          rotate: lowerJawRotate,
          transformBox: 'fill-box',
          transformOrigin: '100% 0%',
        }}
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

      {/* Maxila superior — sobe pouco; mesma dobradiça, canto inferior-direita */}
      <motion.g
        style={{
          rotate: upperJawRotate,
          transformBox: 'fill-box',
          transformOrigin: '100% 100%',
        }}
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

      {/* Crânio e olhos: PARADOS. Se girassem junto, o rosto desmontaria. */}
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

      {/* ---- Trompete: a mão fecha em volta do bocal --------------------- */}

      <g transform="translate(202 66) rotate(-32)">
        <rect
          x="-4"
          y="-5"
          width="30"
          height="10"
          rx="5"
          fill="url(#gator-brass)"
          stroke={OUTLINE}
          strokeWidth="2.5"
        />
        <path
          d="M26 -15 L46 -24 L46 24 L26 15 Z"
          fill="url(#gator-brass)"
          stroke={OUTLINE}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect x="4" y="-11" width="4" height="7" rx="2" fill="#B8901F" />
        <rect x="12" y="-11" width="4" height="7" rx="2" fill="#B8901F" />
      </g>
      {/* Mão fechando sobre o bocal — sem isso o trompete flutua */}
      <ellipse cx="203" cy="67" rx="12" ry="11" fill={LIMB} stroke={OUTLINE} strokeWidth="3" />

      {/* Notas musicais — o jacaré comemora a refeição */}
      <motion.g style={{ opacity: notesOpacity }} className="animate-float">
        <g fill="#F7E3AE" stroke={OUTLINE} strokeWidth="1.5">
          <circle cx="214" cy="26" r="5" />
          <rect x="217" y="6" width="2.8" height="21" rx="1.4" />
          <circle cx="190" cy="14" r="4" />
          <rect x="192.6" y="-2" width="2.4" height="17" rx="1.2" />
        </g>
      </motion.g>
    </svg>
  );
}
