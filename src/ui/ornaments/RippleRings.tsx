import { cn } from '@/ui/cn';

const RINGS = ['0s', '1.3s', '2.6s'] as const;

/**
 * Anéis de água que se expandem em loop, como algo que acabou de tocar a
 * superfície do lago.
 *
 * CSS puro com `animation-delay` escalonado, sem JavaScript: é decoração de
 * primeira dobra e não deve esperar hidratação para começar. Serve de âncora
 * visual atrás da coroa no herói.
 */
export function RippleRings({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 grid place-items-center', className)}
    >
      {RINGS.map((delay) => (
        <span
          key={delay}
          style={{ animationDelay: delay }}
          className="animate-ripple border-gold-500/35 absolute block aspect-square w-full rounded-full border"
        />
      ))}
    </span>
  );
}
