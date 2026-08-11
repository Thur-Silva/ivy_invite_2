import { cn } from '@/ui/cn';

/**
 * A tiara da Ivy.
 *
 * O brilho que atravessa o ouro é feito **dentro** do SVG: um retângulo claro
 * inclinado, recortado pelo `clipPath` da própria coroa e deslocado por CSS. Um
 * overlay em DOM por cima do ícone vazaria como uma faixa retangular sobre a
 * área transparente; recortado pela silhueta, o reflexo só existe no metal.
 */
export function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 84"
      role="presentation"
      aria-hidden="true"
      className={cn('h-auto w-full', className)}
    >
      <defs>
        <linearGradient id="crown-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3d68f" />
          <stop offset="45%" stopColor="#e9c46a" />
          <stop offset="100%" stopColor="#c9a227" />
        </linearGradient>
        <linearGradient id="crown-glint" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff6e8" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff6e8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff6e8" stopOpacity="0" />
        </linearGradient>
        <clipPath id="crown-silhouette">
          <path d="M10 70 L18 26 L38 48 L60 14 L82 48 L102 26 L110 70 Z" />
          <rect x="8" y="70" width="104" height="9" rx="4.5" />
        </clipPath>
      </defs>

      <path
        d="M10 70 L18 26 L38 48 L60 14 L82 48 L102 26 L110 70 Z"
        fill="url(#crown-gold)"
        stroke="#fff6e8"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="8" y="70" width="104" height="9" rx="4.5" fill="url(#crown-gold)" />

      <g clipPath="url(#crown-silhouette)">
        <rect
          x="0"
          y="0"
          width="26"
          height="84"
          fill="url(#crown-glint)"
          className="animate-glint"
          style={{ transformBox: 'fill-box' }}
        />
      </g>

      {/* Gemas: rubi central e as duas laterais. */}
      <circle cx="60" cy="10" r="5" fill="#ffd9e1" />
      <circle cx="18" cy="22" r="3.5" fill="#f4a6b8" />
      <circle cx="102" cy="22" r="3.5" fill="#f4a6b8" />
      <circle cx="60" cy="74.5" r="2.6" fill="#0b2e23" fillOpacity="0.55" />
    </svg>
  );
}
