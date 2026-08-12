/**
 * ============================================================================
 *  ÚNICO ARQUIVO QUE OS ANFITRIÕES PRECISAM EDITAR
 * ============================================================================
 *
 * Dados da festa da Ivy. Tudo aqui é validado pelos Value Objects do domínio
 * ao subir a aplicação: um erro de digitação em latitude/longitude ou uma data
 * inválida quebra o boot em vez de gerar um convite errado.
 *
 * TODO(anfitriões): confirmar os valores marcados com [PLACEHOLDER].
 */
export const celebrationConfig = {
  honoree: {
    name: 'Ivy',
    turningAge: 2,
  },

  schedule: {
    /** [PLACEHOLDER] Início da festa, no fuso de São Paulo (-03:00). */
    startsAt: '2026-09-13T15:00:00-03:00',
    /** [PLACEHOLDER] Fim previsto. */
    endsAt: '2026-09-13T19:00:00-03:00',
    timeZone: 'America/Sao_Paulo',
  },

  venue: {
    /** [PLACEHOLDER] Nome do salão / casa. */
    name: 'Casa da Ivy',
    /** [PLACEHOLDER] Rua, número e complemento. */
    streetAddress: 'Estrada dos Pardais, S/N',
    /** [PLACEHOLDER] Bairro, cidade e estado. */
    locality: 'Furnas, Extrama, Minas Gerais',
    /**
     * [PLACEHOLDER] Coordenadas exatas da entrada.
     * Como obter: abra o Google Maps, clique com o botão direito no ponto
     * exato e copie os dois números que aparecem no topo do menu.
     */
    latitude: -22.761617,
    longitude: -46.307506,
  },

  /** Traje sugerido. A paleta vira amostras de cor no convite. */
  dressCode: {
    headline: 'Traje',
    guidance:
      'Venha confortável, na paleta do reino: tons de verde e bege. ' +
      'Nada de gala. É festa de criança e tem grama por perto.',
    palette: [
      { name: 'Verde musgo', hex: '#4F6F52' },
      { name: 'Verde sálvia', hex: '#8BA888' },
      { name: 'Bege areia', hex: '#D8C3A5' },
      { name: 'Bege claro', hex: '#EFE3D0' },
    ],
  },
} as const;

export type CelebrationConfig = typeof celebrationConfig;
