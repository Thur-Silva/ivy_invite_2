import { cn } from '@/ui/cn';

/** Gold divider with a water-lily at its centre. Separates the page's acts. */
export function Flourish({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 24"
      role="presentation"
      aria-hidden="true"
      className={cn('h-6 w-full max-w-[240px]', className)}
    >
      <defs>
        <linearGradient id="flourish-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9a227" stopOpacity="0" />
          <stop offset="50%" stopColor="#e9c46a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 12 H96" stroke="url(#flourish-line)" strokeWidth="1.5" />
      <path d="M144 12 H240" stroke="url(#flourish-line)" strokeWidth="1.5" />
      <g transform="translate(120 12)">
        <path d="M0 -9 C4 -4 4 4 0 9 C-4 4 -4 -4 0 -9 Z" fill="#f4a6b8" />
        <path d="M-9 0 C-4 -4 4 -4 9 0 C4 4 -4 4 -9 0 Z" fill="#ffd9e1" fillOpacity="0.85" />
        <circle cx="0" cy="0" r="2.4" fill="#e9c46a" />
      </g>
    </svg>
  );
}
