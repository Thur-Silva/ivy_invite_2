import { cn } from '@/ui/cn';

/**
 * O sapo príncipe, coroa inclusa. A outra metade do tema.
 *
 * A piscada é feita achatando o **próprio grupo dos olhos** em `scaleY`, com
 * duas linhas escuras por trás para o olho fechado ler como um traço. É como
 * desenho animado faz, e sobrevive a `prefers-reduced-motion`: o keyframe termina
 * em `scaleY(1)`, então quando o navegador salta para o último quadro o sapo fica
 * com os olhos abertos, não com a pálpebra travada no meio.
 */
export function FrogPrinceIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 110"
      role="presentation"
      aria-hidden="true"
      className={cn('h-auto w-full', className)}
    >
      <defs>
        <radialGradient id="frog-skin" cx="0.4" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#6ec49b" />
          <stop offset="60%" stopColor="#3fa07a" />
          <stop offset="100%" stopColor="#1f6349" />
        </radialGradient>
        <linearGradient id="frog-crown" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3d68f" />
          <stop offset="100%" stopColor="#c9a227" />
        </linearGradient>
      </defs>

      {/* Patas traseiras apoiadas na vitória-régia */}
      <ellipse cx="26" cy="92" rx="17" ry="8" fill="#1f6349" />
      <ellipse cx="94" cy="92" rx="17" ry="8" fill="#1f6349" />

      <ellipse cx="60" cy="70" rx="38" ry="28" fill="url(#frog-skin)" />
      <ellipse cx="60" cy="46" rx="32" ry="24" fill="url(#frog-skin)" />

      {/* Olho fechado: o traço que aparece quando o grupo acima achata */}
      <path
        d="M38 34 H54 M66 34 H82"
        stroke="#0b2e23"
        strokeOpacity="0.65"
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      <g className="animate-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <circle cx="46" cy="34" r="11" fill="#fff6e8" />
        <circle cx="74" cy="34" r="11" fill="#fff6e8" />
        <circle cx="47.5" cy="35.5" r="5" fill="#04140f" />
        <circle cx="72.5" cy="35.5" r="5" fill="#04140f" />
        <circle cx="49.5" cy="33" r="1.8" fill="#fff6e8" />
        <circle cx="74.5" cy="33" r="1.8" fill="#fff6e8" />
      </g>

      {/* Sorriso */}
      <path
        d="M44 54 Q60 66 76 54"
        fill="none"
        stroke="#0b2e23"
        strokeOpacity="0.6"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <ellipse cx="60" cy="78" rx="21" ry="14" fill="#ffd9e1" fillOpacity="0.35" />

      {/* Coroa miúda */}
      <path
        d="M44 16 L48 4 L55 11 L60 0 L65 11 L72 4 L76 16 Z"
        fill="url(#frog-crown)"
        stroke="#fff6e8"
        strokeOpacity="0.4"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
