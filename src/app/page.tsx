import { makeGetCelebrationDetails } from '@/contexts/celebration/infrastructure/composition-root';
import { DriftingPetals } from '@/graphics/scroll-journey/DriftingPetals';
import { GatorStageProvider } from '@/graphics/scroll-journey/gator-stage';
import { ScrollJourney } from '@/graphics/scroll-journey/ScrollJourney';
import { ClosingSection } from './_sections/ClosingSection';
import { DressCodeSection } from './_sections/DressCodeSection';
import { GatorStageSection } from './_sections/GatorStageSection';
import { HeroSection } from './_sections/HeroSection';
import { RsvpSection } from './_sections/RsvpSection';
import { StorySection } from './_sections/StorySection';
import { VenueSection } from './_sections/VenueSection';

/**
 * O convite. Uma rolagem, em atos.
 *
 * Este é o ponto de encontro dos dois Bounded Contexts, e o encontro é raso de
 * propósito: Celebration entrega um read model, RSVP é dono do próprio formulário
 * e da própria Server Action. Nenhum importa o outro.
 *
 * `main` é `relative` porque é o sistema de coordenadas das camadas decorativas:
 * as pétalas de parallax e a trilha do vaga-lume se posicionam em relação à
 * altura total do documento, e é `main` que define essa altura.
 *
 * Ordem de empilhamento, de trás para frente:
 *   −10  lago WebGL (fixo, no layout)
 *    −2  pétalas com parallax
 *    −1  trilha e vaga-lume que acompanham a leitura
 *     0  o convite em si
 *
 * **Nada decorativo que precise de espaço próprio entra nas camadas negativas.**
 * O jacaré aprendeu isso na prática: enquanto era enfeite de fundo plantado numa
 * fração da altura da página, o cartão do mapa passou por cima dele. Hoje ele tem
 * `GatorStageSection`, uma seção no fluxo. E `GatorStageProvider` é o que liga a
 * medição dessa seção ao vaga-lume da camada de fundo.
 */
export default async function InvitationPage() {
  const celebration = await makeGetCelebrationDetails().execute();

  return (
    <main className="relative flex flex-col">
      <DriftingPetals />

      <GatorStageProvider>
        <ScrollJourney />

        <HeroSection celebration={celebration} />
        <StorySection celebration={celebration} />
        <RsvpSection />
        <DressCodeSection celebration={celebration} />
        <VenueSection celebration={celebration} />
        <GatorStageSection />
        <ClosingSection />
      </GatorStageProvider>
    </main>
  );
}
