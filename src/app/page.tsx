import { makeGetCelebrationDetails } from '@/contexts/celebration/infrastructure/composition-root';
import { DriftingPetals } from '@/graphics/scroll-journey/DriftingPetals';
import { ScrollJourney } from '@/graphics/scroll-journey/ScrollJourney';
import { ClosingSection } from './_sections/ClosingSection';
import { HeroSection } from './_sections/HeroSection';
import { RsvpSection } from './_sections/RsvpSection';
import { StorySection } from './_sections/StorySection';
import { VenueSection } from './_sections/VenueSection';

/**
 * O convite — uma rolagem, quatro atos.
 *
 * Este é o ponto de encontro dos dois Bounded Contexts, e o encontro é raso de
 * propósito: Celebration entrega um read model, RSVP é dono do próprio formulário
 * e da própria Server Action. Nenhum importa o outro.
 *
 * `main` é `relative` porque é o sistema de coordenadas das camadas decorativas:
 * a trilha do vaga-lume e as pétalas de parallax se posicionam em relação à
 * altura total do documento, e é `main` que define essa altura.
 *
 * Ordem de empilhamento, de trás para frente:
 *   −10  lago WebGL (fixo, no layout)
 *    −2  pétalas com parallax
 *    −1  trilha + vaga-lume que acompanham a leitura
 *     0  o convite em si
 */
export default async function InvitationPage() {
  const celebration = await makeGetCelebrationDetails().execute();

  return (
    <main className="relative flex flex-col">
      <DriftingPetals />
      <ScrollJourney />

      <HeroSection celebration={celebration} />
      <StorySection celebration={celebration} />
      <RsvpSection />
      <VenueSection celebration={celebration} />
      <ClosingSection />
    </main>
  );
}
