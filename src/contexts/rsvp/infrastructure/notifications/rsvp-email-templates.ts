import type { GuestRoster } from '../../application/use-cases/get-guest-roster.use-case';

/**
 * Corpo dos e-mails de RSVP.
 *
 * ## O que dá e o que não dá em e-mail, sem ilusão
 *
 * Cliente de e-mail não é navegador, e o público aqui é Gmail (todo mundo entra
 * com conta Google). O Gmail **remove o `<style>` inteiro**, então:
 *
 *  - `@keyframes` e `:hover` **não** aparecem no Gmail. Vão no `<style>` de
 *    qualquer forma, como enfeite para Apple Mail e iOS Mail, mas o desenho tem
 *    de estar completo sem eles. Nada de informação depender de animação.
 *  - **SVG é removido** pelo Gmail. Todo desenho aqui é HTML: círculo é
 *    `border-radius`, barra é célula de tabela com largura percentual.
 *  - Outlook desktop usa o motor do Word: ignora `border-radius` e gradiente.
 *    Por isso todo gradiente vem acompanhado de `bgcolor`, que é o que ele lê.
 *
 * O resultado é um desenho que fica bonito no Gmail, ganha movimento no Apple
 * Mail e continua legível no Outlook. A ordem dessas três frases é a prioridade.
 *
 * ## O gráfico é uma tabela
 *
 * Barra empilhada feita de duas `<td>` com largura em porcentagem. Funciona em
 * **todo** cliente, inclusive Outlook, sem imagem, sem script e sem serviço
 * externo gerando PNG. É a técnica certa para gráfico em e-mail.
 */

const C = {
  ink: '#0B2E23',
  paper: '#FFF6E8',
  water: '#04140F',
  deep: '#0A2019',
  gold: '#C9A227',
  goldSoft: '#E9C46A',
  goldPale: '#F7E3AE',
  sage: '#557B49',
  leaf: '#87AC6E',
  blush: '#B3486B',
  blushSoft: '#F4A6B8',
  muted: '#6B7F72',
  line: 'rgba(11,46,35,0.10)',
} as const;

const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

/** Escapa o que vem de fora antes de virar HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Versão legível: sem marcação e sem as entidades que `escapeHtml` criou. */
function toPlain(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Enfeites que só alguns clientes mostram.
 *
 * Fica num `<style>` porque não existe outro jeito de declarar `@keyframes`. O
 * Gmail descarta o bloco inteiro e nada se perde: cada elemento animado já tem
 * aparência final definida inline. Aqui só se acrescenta movimento.
 */
const PROGRESSIVE_STYLE = `<style>
  @media (prefers-color-scheme: dark) {
    .sheet { background: ${C.deep} !important; }
    .ink, .ink * { color: ${C.paper} !important; }
    .soft { color: rgba(255,246,232,0.62) !important; }
    .row-alt { background: rgba(255,246,232,0.04) !important; }
  }
  @keyframes ivyShimmer {
    0%   { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes ivyFloat {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-5px); }
  }
  @keyframes ivyPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.72; transform: scale(1.14); }
  }
  @keyframes ivyGrow {
    from { transform: scaleX(0.02); }
    to   { transform: scaleX(1); }
  }
  @keyframes ivyRise {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-shimmer { background-size: 200% auto; animation: ivyShimmer 5s linear infinite; }
  .anim-float   { animation: ivyFloat 4.5s ease-in-out infinite; }
  .anim-pulse   { animation: ivyPulse 2.6s ease-in-out infinite; }
  .anim-grow    { transform-origin: left center; animation: ivyGrow 1.5s cubic-bezier(.22,1,.36,1) both; }
  .anim-rise    { animation: ivyRise .8s ease-out both; }
  .d1 { animation-delay: .1s } .d2 { animation-delay: .25s } .d3 { animation-delay: .4s }
  .d4 { animation-delay: .55s } .d5 { animation-delay: .7s }
  a.cta:hover { background: ${C.gold} !important; }
  @media (max-width: 480px) {
    .stack { display: block !important; width: 100% !important; }
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
    .big { font-size: 30px !important; }
  }
</style>`;

/** Vaga-lume decorativo: círculo com halo, feito de `border-radius`. */
function firefly(size: number, delayClass: string): string {
  return `<span class="anim-pulse ${delayClass}" style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;background:${C.goldPale};box-shadow:0 0 ${size * 2}px ${size / 2}px rgba(233,196,106,0.55);"></span>`;
}

/** Fita superior com gradiente e reserva de cor para o Outlook. */
function crownBand(): string {
  return `<tr><td height="7" bgcolor="${C.gold}" style="height:7px;line-height:7px;font-size:0;background-image:linear-gradient(90deg,${C.gold},${C.goldPale},${C.blushSoft},${C.gold});" class="anim-shimmer">&nbsp;</td></tr>`;
}

/** Divisor com vitória-régia no meio, tudo em HTML. */
function flourish(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="border-top:1px solid ${C.line};"></td>
    <td width="26" align="center" style="padding:0 8px;">
      <span style="display:inline-block;width:9px;height:9px;border-radius:50% 50% 50% 0;background:${C.blushSoft};transform:rotate(45deg);"></span>
    </td>
    <td style="border-top:1px solid ${C.line};"></td>
  </tr></table>`;
}

interface Rendered {
  subject: string;
  html: string;
  text: string;
}

/** Moldura: fundo escuro, folha clara, fita de ouro, rodapé discreto. */
function shell(input: { preheader: string; body: string; footnote: string }): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark">${PROGRESSIVE_STYLE}</head>
<body style="margin:0;padding:0;background:${C.water};">
<div style="display:none;font-size:1px;color:${C.water};max-height:0;overflow:hidden;">${input.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.water}" style="background:${C.water};background-image:radial-gradient(120% 70% at 50% 0%,#17513C 0%,${C.water} 70%);">
  <tr><td align="center" style="padding:26px 12px 34px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="sheet" bgcolor="${C.paper}" style="max-width:560px;background:${C.paper};border-radius:18px;overflow:hidden;font-family:${FONT};">
      ${crownBand()}
      ${input.body}
      <tr><td class="pad" style="padding:18px 30px 28px;border-top:1px solid ${C.line};">
        <p class="soft" style="margin:0;font-size:11.5px;line-height:1.6;color:${C.muted};">${input.footnote}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/* ========================================================================== */
/*  Convidado                                                                 */
/* ========================================================================== */

/**
 * Recibo do convidado.
 *
 * **Sem uma linha de regra.** Nada de "uma resposta por convidado", nada de
 * "mudou de ideia? volte e responda", nada de explicar por que recebeu. Quem
 * respondeu quer saber que deu certo e ver algo bonito; instrução de uso é
 * assunto do convite, que está a um toque de distância.
 *
 * O que sobrou: o nome dele, um selo, um vaga-lume piscando e o botão.
 */
export function guestReceiptEmail(input: {
  firstName: string;
  attending: boolean;
  invitationUrl: string;
}): Rendered {
  const name = escapeHtml(input.firstName);
  const accent = input.attending ? C.gold : C.leaf;
  const accentSoft = input.attending ? C.goldPale : '#CFE0BF';
  const seal = input.attending ? 'Presença confirmada' : 'Resposta registrada';
  const greeting = input.attending ? `Que alegria, ${name}!` : `Obrigada por avisar, ${name}.`;
  const line = input.attending
    ? 'Seu lugar está guardado no reino encantado.'
    : 'A Ivy manda um beijo de princesa para você.';

  const body = `
  <tr><td align="center" class="pad" style="padding:34px 30px 6px;">
    <div class="anim-float" style="margin:0 0 18px;">${firefly(11, 'd1')}
      <span style="display:inline-block;width:26px;"></span>${firefly(7, 'd3')}
      <span style="display:inline-block;width:18px;"></span>${firefly(9, 'd2')}
    </div>
    <p class="soft anim-rise d1" style="margin:0 0 10px;font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:${C.sage};">Ivy faz 2 anos</p>
    <h1 class="ink big anim-rise d2" style="margin:0 0 14px;font-family:${SERIF};font-size:34px;line-height:1.2;font-weight:normal;color:${C.ink};">${greeting}</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="anim-rise d3"><tr>
      <td bgcolor="${accentSoft}" style="padding:8px 18px;border-radius:999px;background:${accentSoft};">
        <span style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;font-weight:bold;color:${C.ink};">${seal}</span>
      </td>
    </tr></table>
    <p class="ink anim-rise d4" style="margin:22px 0 0;font-size:16.5px;line-height:1.6;color:${C.ink};">${line}</p>
  </td></tr>
  <tr><td class="pad" style="padding:24px 30px 6px;">${flourish()}</td></tr>
  <tr><td align="center" class="pad" style="padding:18px 30px 34px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="anim-rise d5"><tr>
      <td bgcolor="${accent}" style="border-radius:999px;background:${accent};background-image:linear-gradient(100deg,${accent},${accentSoft},${accent});">
        <a class="cta" href="${input.invitationUrl}" style="display:inline-block;padding:15px 30px;font-family:${SERIF};font-size:16px;font-weight:bold;color:${C.water};text-decoration:none;border-radius:999px;">Ver o convite</a>
      </td>
    </tr></table>
  </td></tr>`;

  const html = shell({
    preheader: `${seal}. ${line}`,
    body,
    footnote: 'Com carinho, a família da Ivy.',
  });

  const text = [
    'Ivy faz 2 anos',
    '',
    toPlain(greeting),
    seal,
    '',
    line,
    '',
    `Ver o convite: ${input.invitationUrl}`,
    '',
    'Com carinho, a familia da Ivy.',
  ].join('\n');

  return {
    subject: input.attending
      ? 'Sua presença está confirmada na festa da Ivy'
      : 'Sua resposta foi registrada',
    html,
    text,
  };
}

/* ========================================================================== */
/*  Admin                                                                     */
/* ========================================================================== */

/** Três números lado a lado, empilhando no celular. */
function statTiles(roster: GuestRoster): string {
  const tile = (label: string, value: number, color: string, delay: string) => `
    <td class="stack" width="33.33%" align="center" valign="top" style="padding:0 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="anim-rise ${delay}"><tr>
        <td align="center" bgcolor="rgba(11,46,35,0.045)" style="padding:14px 6px;border-radius:12px;background:rgba(11,46,35,0.045);">
          <p class="ink" style="margin:0;font-family:${SERIF};font-size:30px;line-height:1;color:${color};">${value}</p>
          <p class="soft" style="margin:6px 0 0;font-size:10.5px;letter-spacing:1.3px;text-transform:uppercase;color:${C.muted};">${label}</p>
        </td>
      </tr></table>
    </td>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    ${tile('Confirmados', roster.attendingCount, C.gold, 'd2')}
    ${tile('Não vão', roster.notAttendingCount, C.blush, 'd3')}
    ${tile('Responderam', roster.total, C.sage, 'd4')}
  </tr></table>`;
}

/**
 * Gráfico de barra empilhada, em tabela.
 *
 * Larguras em porcentagem, cores em `bgcolor`: nenhuma imagem, nenhum script,
 * nenhum serviço externo gerando PNG. Renderiza igual em Gmail, Apple Mail e
 * Outlook. O `anim-grow` faz a barra crescer onde `<style>` sobrevive, e onde não
 * sobrevive ela já aparece no tamanho final.
 */
function stackedBar(roster: GuestRoster): string {
  if (roster.total === 0) {
    return `<p class="soft" style="margin:0;font-size:13px;color:${C.muted};">Nenhuma resposta ainda.</p>`;
  }

  const yes = roster.attendingPercent;
  const no = 100 - yes;

  // Fatia de 0% viraria uma célula de largura zero que alguns clientes colapsam
  // com borda visível. Omitir é mais limpo que forçar 1px.
  const yesCell =
    yes > 0
      ? `<td width="${yes}%" bgcolor="${C.gold}" style="background:${C.gold};background-image:linear-gradient(90deg,${C.gold},${C.goldSoft});height:22px;line-height:22px;font-size:0;">&nbsp;</td>`
      : '';
  const noCell =
    no > 0
      ? `<td width="${no}%" bgcolor="${C.blush}" style="background:${C.blush};background-image:linear-gradient(90deg,${C.blush},${C.blushSoft});height:22px;line-height:22px;font-size:0;">&nbsp;</td>`
      : '';

  const legend = (color: string, label: string, percent: number) =>
    `<td width="50%" style="padding-top:10px;">
      <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};"></span>
      <span class="soft" style="font-size:12px;color:${C.muted};">&nbsp;${label} <strong style="color:${C.ink};">${percent}%</strong></span>
    </td>`;

  return `
  <div class="anim-grow d2" style="border-radius:999px;overflow:hidden;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:999px;overflow:hidden;"><tr>${yesCell}${noCell}</tr></table>
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    ${legend(C.gold, 'Vão', yes)}
    <td width="50%" align="right" style="padding-top:10px;">
      <span class="soft" style="font-size:12px;color:${C.muted};">Não vão <strong style="color:${C.ink};">${no}%</strong>&nbsp;</span>
      <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${C.blush};"></span>
    </td>
  </tr></table>`;
}

/** Lista completa, com a pessoa da vez destacada. */
function rosterTable(roster: GuestRoster, highlightName: string): string {
  if (roster.entries.length === 0) {
    return `<p class="soft" style="margin:0;font-size:13px;color:${C.muted};">A lista aparece aqui a partir da primeira resposta.</p>`;
  }

  const rows = roster.entries
    .map((entry, index) => {
      const isNew = entry.name.toLowerCase() === highlightName.toLowerCase();
      const zebra = index % 2 === 1;
      const pillBg = entry.attending ? C.goldPale : '#F6D5DE';
      const pillText = entry.attending ? 'VAI' : 'NÃO VAI';

      return `<tr class="${zebra ? 'row-alt' : ''}" ${zebra ? `bgcolor="rgba(11,46,35,0.03)"` : ''} style="${zebra ? 'background:rgba(11,46,35,0.03);' : ''}">
        <td style="padding:10px 12px;border-bottom:1px solid ${C.line};">
          <span class="ink" style="font-size:14px;color:${C.ink};${isNew ? 'font-weight:bold;' : ''}">${escapeHtml(entry.name)}</span>
          ${isNew ? `<span style="display:inline-block;margin-left:7px;padding:1px 7px;border-radius:999px;background:${C.sage};font-size:9px;letter-spacing:1px;color:${C.paper};vertical-align:middle;">AGORA</span>` : ''}
        </td>
        <td align="right" style="padding:10px 12px;border-bottom:1px solid ${C.line};">
          <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${pillBg};font-size:10px;letter-spacing:0.8px;font-weight:bold;color:${C.ink};">${pillText}</span>
        </td>
      </tr>`;
    })
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows}</table>`;
}

/**
 * Relatório do admin, a cada resposta.
 *
 * Aqui a regra e o número são bem-vindos: é exatamente para isto que este e-mail
 * existe. Quem recebe é quem precisa fechar número com buffet e lembrancinha, e
 * abrir o `db:studio` para saber disso não é uma opção realista.
 */
export function adminReportEmail(input: {
  guestName: string;
  guestEmail: string;
  attending: boolean;
  changed: boolean;
  roster: GuestRoster | null;
  invitationUrl: string;
}): Rendered {
  const name = escapeHtml(input.guestName);
  const email = escapeHtml(input.guestEmail);
  const accent = input.attending ? C.gold : C.blush;
  const verb = input.attending ? 'confirmou presença' : 'não vai poder ir';
  const headline = input.changed ? `mudou de ideia: ${verb}` : verb;

  const chartBlock =
    input.roster === null
      ? `<p class="soft" style="margin:0;font-size:13px;color:${C.muted};">Não foi possível ler a lista completa agora. A resposta acima está gravada.</p>`
      : `${statTiles(input.roster)}
         <div style="height:22px;"></div>
         ${stackedBar(input.roster)}`;

  const listBlock =
    input.roster === null
      ? ''
      : `<tr><td class="pad" style="padding:26px 30px 6px;">${flourish()}</td></tr>
         <tr><td class="pad" style="padding:16px 30px 4px;">
           <p class="soft" style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.sage};">Lista completa</p>
         </td></tr>
         <tr><td class="pad" style="padding:0 22px 30px;">${rosterTable(input.roster, input.guestName)}</td></tr>`;

  const body = `
  <tr><td class="pad" style="padding:30px 30px 4px;">
    <p class="soft anim-rise d1" style="margin:0 0 8px;font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:${C.sage};">Relatório do convite</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="anim-rise d1"><tr>
      <td valign="middle" width="14" style="padding-right:10px;">
        <span class="anim-pulse" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${accent};box-shadow:0 0 14px 4px ${accent}55;"></span>
      </td>
      <td valign="middle">
        <h1 class="ink big" style="margin:0;font-family:${SERIF};font-size:28px;line-height:1.25;font-weight:normal;color:${C.ink};">${name}</h1>
      </td>
    </tr></table>
    <p class="ink" style="margin:8px 0 0;font-size:15.5px;line-height:1.5;color:${C.ink};">${headline}.</p>
    <p class="soft" style="margin:5px 0 0;font-size:12.5px;color:${C.muted};">${email}</p>
  </td></tr>
  <tr><td class="pad" style="padding:24px 30px 6px;">${flourish()}</td></tr>
  <tr><td class="pad" style="padding:20px 30px 8px;">${chartBlock}</td></tr>
  ${listBlock}
  <tr><td align="center" class="pad" style="padding:4px 30px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
      <td bgcolor="${C.ink}" style="border-radius:999px;background:${C.ink};">
        <a class="cta" href="${input.invitationUrl}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:bold;color:${C.paper};text-decoration:none;border-radius:999px;">Abrir o convite</a>
      </td>
    </tr></table>
  </td></tr>`;

  const totals =
    input.roster === null
      ? 'lista indisponível'
      : `${input.roster.attendingCount} vão, ${input.roster.notAttendingCount} não vão, ${input.roster.total} responderam`;

  const html = shell({
    // Escapado: o preheader é HTML, mesmo escondido.
    preheader: `${name} ${verb}. ${totals}.`,
    body,
    footnote: 'Relatório automático do convite da Ivy, enviado a cada resposta.',
  });

  const listaTexto =
    input.roster === null
      ? []
      : [
          '',
          'Lista completa:',
          ...input.roster.entries.map(
            (entry) => `  ${entry.attending ? '[VAI]     ' : '[NAO VAI] '} ${entry.name}`,
          ),
        ];

  const text = [
    'Relatorio do convite da Ivy',
    '',
    `${input.guestName} ${toPlain(headline)}.`,
    input.guestEmail,
    '',
    totals,
    ...listaTexto,
    '',
    `Abrir o convite: ${input.invitationUrl}`,
  ].join('\n');

  const countLabel = input.roster === null ? '' : ` (${input.roster.attendingCount} confirmados)`;

  return {
    subject: `${input.guestName} ${verb}${countLabel}`,
    html,
    text,
  };
}
