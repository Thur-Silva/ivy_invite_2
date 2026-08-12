/**
 * Corpo dos e-mails de RSVP.
 *
 * ## Por que não repetimos data, endereço e traje aqui
 *
 * Seria o instinto óbvio, e é armadilha. Um e-mail é um retrato: se o horário ou
 * o local mudarem depois, a caixa de entrada do convidado guarda a versão velha
 * para sempre, e ele vai confiar nela. O convite na web é a fonte da verdade e
 * está sempre atualizado, então o e-mail confirma o **fato** ("sua resposta foi
 * registrada") e aponta para lá.
 *
 * Isso também mantém o contexto RSVP sem saber nada sobre o contexto Celebration,
 * que é a fronteira que a arquitetura promete (relação Separate Ways).
 *
 * ## Por que HTML escrito à mão, com estilo inline
 *
 * Cliente de e-mail não é navegador: Gmail e Outlook descartam `<style>`, ignoram
 * boa parte de flexbox e reescrevem CSS externo. Estilo inline em tabela é o que
 * atravessa os dois. E o serviço não oferece templates (a doc é explícita), então
 * o corpo sai pronto daqui.
 */

const PALETTE = {
  ink: '#0B2E23',
  paper: '#FFF6E8',
  water: '#04140F',
  gold: '#C9A227',
  sage: '#557B49',
  muted: '#6B7F72',
} as const;

interface Shell {
  readonly title: string;
  readonly lead: string;
  readonly bodyLines: readonly string[];
  readonly invitationUrl: string;
  readonly footnote: string;
}

/** Escapa o que vem de fora antes de virar HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Moldura comum. Tabela e estilo inline de propósito, ver nota no topo.
 *
 * O nome do convidado passa por `escapeHtml` porque, apesar de `GuestName` já
 * recusar `<` e `>`, a defesa contra injeção pertence a quem monta o HTML. Se um
 * dia a invariante do nome afrouxar, este arquivo não vira um buraco.
 */
function render(shell: Shell): { html: string; text: string } {
  const paragraphs = shell.bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${PALETTE.ink};">${line}</p>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px 12px;background:${PALETTE.water};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;margin:0 auto;background:${PALETTE.paper};border-radius:16px;overflow:hidden;">
  <tr><td style="height:6px;background:${PALETTE.gold};"></td></tr>
  <tr><td style="padding:28px 28px 8px;">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${PALETTE.sage};">Ivy faz 2 anos</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${PALETTE.ink};">${shell.title}</h1>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.5;color:${PALETTE.ink};">${shell.lead}</p>
    ${paragraphs}
    <p style="margin:24px 0 8px;">
      <a href="${shell.invitationUrl}" style="display:inline-block;padding:13px 22px;background:${PALETTE.gold};color:${PALETTE.water};text-decoration:none;border-radius:999px;font-size:15px;font-weight:bold;">Ver o convite</a>
    </p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:${PALETTE.muted};">
      Data, endereço e traje estão sempre atualizados no convite. É de lá que sai a
      versão que vale.
    </p>
  </td></tr>
  <tr><td style="padding:16px 28px 26px;border-top:1px solid rgba(11,46,35,0.12);">
    <p style="margin:0;font-size:12px;line-height:1.5;color:${PALETTE.muted};">${shell.footnote}</p>
  </td></tr>
</table>
</body></html>`;

  // Parte texto puro escrita à mão, não derivada do HTML: o serviço deriva uma
  // se faltar, mas a versão dele mantém a poluição da marcação. Esta é legível.
  const text = [
    'Ivy faz 2 anos',
    '',
    toPlain(shell.title),
    '',
    toPlain(shell.lead),
    '',
    ...shell.bodyLines.map(toPlain),
    '',
    `Ver o convite: ${shell.invitationUrl}`,
    '',
    'Data, endereco e traje estao sempre atualizados no convite.',
    '',
    toPlain(shell.footnote),
  ].join('\n');

  return { html, text };
}

/**
 * Versão legível de um trecho montado para HTML.
 *
 * Remove marcação **e** desfaz as entidades que `escapeHtml` introduziu. Sem o
 * segundo passo, quem lê em texto puro recebe `D&#39;Ávila` no lugar do
 * apóstrofo, que é pior que não ter parte texto nenhuma.
 */
function toPlain(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Confirmação para o convidado que respondeu "vou". */
export function guestConfirmedEmail(input: { firstName: string; invitationUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml(input.firstName);
  const { html, text } = render({
    title: 'Sua presença está confirmada',
    lead: `Que alegria, ${name}!`,
    bodyLines: [
      'Guardamos seu lugar no reino encantado. A Ivy vai adorar te ver por lá.',
      'Mudou de ideia? Volte ao convite e responda de novo, que a gente atualiza.',
    ],
    invitationUrl: input.invitationUrl,
    footnote:
      'Você recebeu este e-mail porque confirmou presença no convite de aniversário da Ivy.',
  });

  return { subject: 'Presença confirmada na festa da Ivy', html, text };
}

/** Recibo para quem respondeu "não vou". */
export function guestDeclinedEmail(input: { firstName: string; invitationUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml(input.firstName);
  const { html, text } = render({
    title: 'Sua resposta foi registrada',
    lead: `Obrigada por avisar, ${name}.`,
    bodyLines: [
      'Vamos sentir sua falta, mas a Ivy manda um beijo de princesa para você.',
      'Se os planos mudarem, volte ao convite e responda de novo. Dá tempo.',
    ],
    invitationUrl: input.invitationUrl,
    footnote: 'Você recebeu este e-mail porque respondeu ao convite de aniversário da Ivy.',
  });

  return { subject: 'Resposta registrada na festa da Ivy', html, text };
}

/** Aviso para os anfitriões, a cada resposta. */
export function hostNotificationEmail(input: {
  guestFullName: string;
  guestEmail: string;
  isAttending: boolean;
  changed: boolean;
  invitationUrl: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(input.guestFullName);
  const email = escapeHtml(input.guestEmail);
  const verb = input.isAttending ? 'confirmou presença' : 'não vai poder ir';
  const prefix = input.changed ? 'mudou de ideia e agora ' : '';

  const { html, text } = render({
    title: input.isAttending ? 'Mais um convidado confirmado' : 'Uma recusa registrada',
    lead: `<strong>${name}</strong> ${prefix}${verb}.`,
    bodyLines: [
      `Conta verificada: ${email}`,
      'A lista completa continua no banco. Rode <code>npm run db:studio</code> para ver todas as respostas.',
    ],
    invitationUrl: input.invitationUrl,
    footnote: 'Aviso automático do convite da Ivy. Você está na lista de anfitriões.',
  });

  const subject = input.isAttending
    ? `${input.guestFullName} vai à festa da Ivy`
    : `${input.guestFullName} não vai poder ir`;

  return { subject, html, text };
}
