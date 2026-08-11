import type { NavigationLinkProvider } from '../../application/ports/navigation-link-provider';
import type { Venue } from '../../domain/value-objects/venue';

/**
 * Anti-Corruption Layer sobre Google Maps e Waze.
 *
 * **Tudo é baseado em coordenada, não em texto.** Buscar pelo endereço escrito
 * faz o Google geocodificar e abrir uma tela de *busca* — sem destino definido e
 * sem botão de rota. Passando `lat,lng` o ponto já entra como destino e a rota
 * abre direto.
 *
 * A vírgula entre latitude e longitude vai **literal**, sem `encodeURIComponent`.
 * Codificada como `%2C`, o parser do Google não reconhece o par de coordenadas e
 * volta a tratar o valor como texto de busca — que era exatamente o sintoma de
 * "abriu o mapa mas não apareceu a opção de rotas".
 *
 * Usa os endpoints **sem API key** (ADR-0006).
 */
export class GoogleMapsLinkProvider implements NavigationLinkProvider {
  /**
   * Prévia embutida já com o alfinete cravado na coordenada.
   * `z=17` é o zoom em que dá para ver a rua e a entrada.
   */
  embedUrl(venue: Venue): string {
    return `https://www.google.com/maps?q=${venue.coordinates.toPair()}&z=17&output=embed`;
  }

  /** Abre o Google Maps já traçando a rota até o portão. */
  directionsUrl(venue: Venue): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates.toPair()}&travelmode=driving`;
  }

  /** Abre o Waze já navegando — `navigate=yes` dispensa confirmação. */
  wazeUrl(venue: Venue): string {
    return `https://www.waze.com/ul?ll=${venue.coordinates.toPair()}&navigate=yes&zoom=17`;
  }
}
