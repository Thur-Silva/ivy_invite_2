import { handlers } from '@/shared/auth/auth';

/**
 * Endpoints do Auth.js: início do fluxo OAuth, callback do provedor e logout.
 *
 * Único arquivo de rota de API do projeto. Todo o resto é Server Action, porque
 * não há consumidor externo (ver ADR-0004); aqui a rota existe por imposição do
 * protocolo, já que o Google precisa de uma URL fixa para onde redirecionar
 * depois do consentimento.
 */
export const { GET, POST } = handlers;
