import { cn } from '@/ui/cn';

/**
 * Glifos inline que substituem emojis na interface.
 *
 * Emoji de teclado é renderizado pela fonte do sistema: muda de desenho entre
 * Android, iOS e Windows, ignora a paleta do convite e denuncia improviso. Cada
 * glifo aqui é SVG vetorial, herda as cores do tema, escala nítido em qualquer
 * densidade de tela e pode ser animado por CSS.
 */

/** Coroa compacta — a opção "Eu vou!". */
export function CrownGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 26" aria-hidden="true" className={cn('h-5 w-5', className)}>
      <path
        d="M3 21 L5.5 7 L12 13.5 L16 3 L20 13.5 L26.5 7 L29 21 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="2.5" y="20.5" width="27" height="3.6" rx="1.8" fill="currentColor" />
      <circle cx="16" cy="1.8" r="1.8" fill="currentColor" />
    </svg>
  );
}

/** Vitória-régia em flor — a opção "Não vou poder". */
export function LilyGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('h-5 w-5', className)}>
      <g fill="currentColor">
        <path d="M16 3 C19.4 8 19.4 15 16 20 C12.6 15 12.6 8 16 3 Z" opacity="0.95" />
        <path d="M6 9 C11 10.5 14.6 14.6 16 20 C10.6 19 6.4 15 6 9 Z" opacity="0.72" />
        <path d="M26 9 C25.6 15 21.4 19 16 20 C17.4 14.6 21 10.5 26 9 Z" opacity="0.72" />
        <path d="M3.5 18 C9 17.6 14 20 16 24.5 C10.5 25.4 5.4 22.6 3.5 18 Z" opacity="0.5" />
        <path d="M28.5 18 C26.6 22.6 21.5 25.4 16 24.5 C18 20 23 17.6 28.5 18 Z" opacity="0.5" />
      </g>
      <circle cx="16" cy="20.5" r="2.4" fill="currentColor" />
    </svg>
  );
}

/** Alfinete de mapa — botão do Google Maps. */
export function MapPinGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('h-5 w-5', className)}>
      <path
        d="M12 22 C12 22 20 14.8 20 9.4 A8 8 0 0 0 4 9.4 C4 14.8 12 22 12 22 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.4" r="2.9" fill="currentColor" />
    </svg>
  );
}

/** Seta de navegação — botão do Waze. */
export function NavigationGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('h-5 w-5', className)}>
      <path
        d="M21 3 L10.4 21 L9.1 13.3 L2.6 9.2 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Vaga-lume: núcleo brilhante com halo. Base do guia de scroll. */
export function FireflyGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('h-4 w-4', className)}>
      <circle cx="12" cy="12" r="10" fill="#ffe9a8" opacity="0.16" />
      <circle cx="12" cy="12" r="6" fill="#ffe9a8" opacity="0.35" />
      <circle cx="12" cy="12" r="2.6" fill="#fff6e8" />
    </svg>
  );
}
