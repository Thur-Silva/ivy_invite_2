'use client';

import { useSyncExternalStore } from 'react';
import { RSVP_FIELD_NAMES } from './rsvp-form.contract';

/** Os traços nunca mudam durante a visita: nada para assinar. */
const noopSubscribe = () => () => {};

/**
 * Lê os traços do aparelho que só o navegador conhece.
 *
 * Nenhum deles identifica a pessoa sozinho; juntos, e combinados com os
 * cabeçalhos lidos no servidor, formam uma assinatura estável do aparelho. Que
 * é o que permite reconhecer quem já respondeu mesmo depois de limpar os cookies
 * ou trocar de rede.
 */
function readDeviceTraits(): string {
  const { screen, devicePixelRatio, navigator } = window;

  return [
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}`,
    `${Math.round(devicePixelRatio * 100)}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    `${navigator.hardwareConcurrency ?? 0}`,
    `${navigator.maxTouchPoints ?? 0}`,
  ].join('|');
}

/**
 * Campo oculto com a assinatura do navegador.
 *
 * Usa `useSyncExternalStore` em vez de `useEffect` + `setState`: os traços são
 * estado externo que o React não possui, e o snapshot de servidor explícito
 * (string vazia) evita divergência de hidratação.
 *
 * **Sem JavaScript o campo simplesmente não é preenchido** e o envio continua
 * válido. A assinatura degrada para `user-agent` + `accept-language`, mais
 * fraca porém estável. O convite nunca deixa de aceitar uma resposta por causa
 * disto.
 */
export function DeviceTraitsField() {
  const traits = useSyncExternalStore(noopSubscribe, readDeviceTraits, () => '');

  return <input type="hidden" name={RSVP_FIELD_NAMES.deviceTraits} value={traits} readOnly />;
}
