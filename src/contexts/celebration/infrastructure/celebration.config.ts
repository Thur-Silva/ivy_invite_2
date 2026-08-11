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
    startsAt: '2026-09-12T15:00:00-03:00',
    /** [PLACEHOLDER] Fim previsto. */
    endsAt: '2026-09-12T19:00:00-03:00',
    timeZone: 'America/Sao_Paulo',
  },

  venue: {
    /** [PLACEHOLDER] Nome do salão / casa. */
    name: 'Espaço Reino Encantado',
    /** [PLACEHOLDER] Rua, número e complemento. */
    streetAddress: 'Rua das Vitórias-Régias, 200',
    /** [PLACEHOLDER] Bairro, cidade e estado. */
    locality: 'Vila Mariana, São Paulo - SP',
    /**
     * [PLACEHOLDER] Coordenadas exatas da entrada.
     * Como obter: abra o Google Maps, clique com o botão direito no ponto
     * exato e copie os dois números que aparecem no topo do menu.
     */
    latitude: -23.5895,
    longitude: -46.6395,
  },
} as const;

export type CelebrationConfig = typeof celebrationConfig;
