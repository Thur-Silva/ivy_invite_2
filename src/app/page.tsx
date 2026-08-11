import { makeGetCelebrationDetails } from '@/contexts/celebration/infrastructure/composition-root';
import { ClosingSection } from './_sections/ClosingSection';
import { HeroSection } from './_sections/HeroSection';
import { RsvpSection } from './_sections/RsvpSection';
import { StorySection } from './_sections/StorySection';
import { VenueSection } from './_sections/VenueSection';

/**
 * The invitation — a single scroll, in four acts.
 *
 * This is the composition point where the two Bounded Contexts meet, and the
 * meeting is deliberately shallow: Celebration hands over a read model, RSVP
 * owns its own form and Server Action. Neither imports the other.
 */
export default async function InvitationPage() {
  const celebration = await makeGetCelebrationDetails().execute();

  return (
    <main className="relative flex flex-col">
      <HeroSection celebration={celebration} />
      <StorySection celebration={celebration} />
      <RsvpSection />
      <VenueSection celebration={celebration} />
      <ClosingSection />
    </main>
  );
}
