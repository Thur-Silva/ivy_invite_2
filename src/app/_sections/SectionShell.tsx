import type { ReactNode } from 'react';
import { Reveal } from '@/ui/Reveal';
import { Flourish } from '@/ui/ornaments/Flourish';

/**
 * Shared frame for every act of the invitation.
 *
 * `max-w-md` is not a compromise for desktop — it is the design: the page is
 * a phone-shaped column, centred on larger screens rather than stretched.
 */
export function SectionShell({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="relative mx-auto w-full max-w-md scroll-mt-8 px-5 py-14 sm:py-20"
    >
      <Reveal className="mb-8 flex flex-col items-center gap-3 text-center">
        <Flourish />
        <h2 id={`${id}-title`} className="font-display text-gold-400 text-2xl tracking-wide">
          {title}
        </h2>
        {subtitle !== undefined ? (
          <p className="text-cream/65 max-w-[36ch] text-sm leading-relaxed text-balance">
            {subtitle}
          </p>
        ) : null}
      </Reveal>

      {children}
    </section>
  );
}
