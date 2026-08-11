/**
 * All the words on the invitation, in one place.
 *
 * Copy is a Presentation concern, not a domain fact: the Celebration context
 * owns *when and where* the party is, while the fairy-tale wording lives here
 * where the hosts can rewrite it without touching a single rule.
 */
export const invitationCopy = {
  hero: {
    eyebrow: 'Era uma vez…',
    theme: 'A Princesa e o Sapo',
    scrollCue: 'deslize para ler o convite',
  },

  story: {
    title: 'O convite',
    paragraphs: [
      'Num reino onde as vitórias-régias flutuam e os vaga-lumes acendem o caminho, uma princesinha muito especial está completando dois anos.',
      'A Ivy quer te ver por lá: tem beijo de sapo, coroa pra todo mundo e bolo à luz de velinha.',
    ],
    signature: 'Com carinho, a família da Ivy',
  },

  rsvp: {
    title: 'Confirme sua presença',
    subtitle:
      'Precisamos saber quantas coroas separar. Cada convidado responde por si, ' +
      'do próprio celular — não dá para confirmar por outra pessoa.',
  },

  dressCode: {
    title: 'O que vestir',
    subtitle: 'Para a foto da família sair combinando com o reino.',
  },

  venue: {
    title: 'Onde acontece',
    subtitle: 'Toque no botão e o mapa abre direto no seu aplicativo de navegação.',
  },

  closing: {
    line: 'Um beijo de princesa,',
    signature: 'Ivy',
  },
} as const;
