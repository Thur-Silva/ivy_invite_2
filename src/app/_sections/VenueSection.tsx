import type { CelebrationView } from '@/contexts/celebration/application/dto/celebration.view';
import { VenueMap } from '@/contexts/celebration/presentation/VenueMap';
import { Reveal } from '@/ui/Reveal';
import { invitationCopy } from '../_content/invitation-copy';
import { SectionShell } from './SectionShell';

/** Where the party happens, with one-tap navigation. */
export function VenueSection({ celebration }: { celebration: CelebrationView }) {
  return (
    <SectionShell
      id="local"
      title={invitationCopy.venue.title}
      subtitle={invitationCopy.venue.subtitle}
    >
      <Reveal>
        <VenueMap celebration={celebration} />
      </Reveal>
    </SectionShell>
  );
}
