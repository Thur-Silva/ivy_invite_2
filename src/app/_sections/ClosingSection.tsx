import { Reveal } from '@/ui/Reveal';
import { Flourish } from '@/ui/ornaments/Flourish';
import { invitationCopy } from '../_content/invitation-copy';

/** Closes the fairy tale. No links, no asks — just a goodbye. */
export function ClosingSection() {
  return (
    <footer className="relative mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 pt-6 pb-24 text-center">
      <Flourish />
      <Reveal>
        <p className="text-cream/60 text-sm">{invitationCopy.closing.line}</p>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="font-script text-foil text-4xl">{invitationCopy.closing.signature}</p>
      </Reveal>
    </footer>
  );
}
