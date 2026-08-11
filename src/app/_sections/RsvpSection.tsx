import { RsvpForm } from '@/contexts/rsvp/presentation/RsvpForm';
import { Reveal } from '@/ui/Reveal';
import { invitationCopy } from '../_content/invitation-copy';
import { SectionShell } from './SectionShell';

/**
 * The reason the site exists.
 *
 * A Server Component that renders one Client Component: only the form itself
 * ships JavaScript, and it is the only island on the page that needs it.
 */
export function RsvpSection() {
  return (
    <SectionShell
      id="presenca"
      title={invitationCopy.rsvp.title}
      subtitle={invitationCopy.rsvp.subtitle}
    >
      <Reveal>
        <RsvpForm />
      </Reveal>
    </SectionShell>
  );
}
