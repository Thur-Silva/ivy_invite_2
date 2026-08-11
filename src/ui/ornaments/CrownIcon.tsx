import { cn } from '@/ui/cn';

/** Ivy's tiara. Inline SVG so it inherits the gold gradient and scales sharp. */
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
      <circle cx="60" cy="10" r="5" fill="#ffd9e1" />
      <circle cx="18" cy="22" r="3.5" fill="#f4a6b8" />
      <circle cx="102" cy="22" r="3.5" fill="#f4a6b8" />
      <circle cx="60" cy="74.5" r="2.6" fill="#0b2e23" fillOpacity="0.55" />
    </svg>
  );
}
