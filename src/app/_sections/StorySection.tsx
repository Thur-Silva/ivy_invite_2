import { CelebrationDetailsCard } from '@/contexts/celebration/presentation/CelebrationDetailsCard';
import type { CelebrationView } from '@/contexts/celebration/application/dto/celebration.view';
import { Reveal } from '@/ui/Reveal';
import { FrogPrinceIcon } from '@/ui/ornaments/FrogPrinceIcon';
import { invitationCopy } from '../_content/invitation-copy';
import { SectionShell } from './SectionShell';

/** The short introduction, plus the date card. */
export function StorySection({ celebration }: { celebration: CelebrationView }) {
  return (
    <SectionShell id="convite" title={invitationCopy.story.title}>
      <div className="flex flex-col items-center gap-7">
        <Reveal className="w-28 sm:w-32">
          <div className="animate-sway">
            <FrogPrinceIcon />
          </div>
        </Reveal>

        {invitationCopy.story.paragraphs.map((paragraph, index) => (
          <Reveal key={paragraph.slice(0, 24)} delay={index * 0.08} className="max-w-[38ch]">
            <p className="text-cream/85 text-center text-[0.95rem] leading-relaxed">{paragraph}</p>
          </Reveal>
        ))}

        <Reveal className="w-full">
          <CelebrationDetailsCard celebration={celebration} />
        </Reveal>

        <Reveal>
          <p className="font-script text-blush-300 text-xl">{invitationCopy.story.signature}</p>
        </Reveal>
      </div>
    </SectionShell>
  );
}
