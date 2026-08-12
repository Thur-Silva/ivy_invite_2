import 'server-only';
import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import { serverEnv } from '@/shared/config/server-env';
import { CompositeDomainEventPublisher } from '@/shared/infrastructure/composite-domain-event-publisher';
import { ConsoleDomainEventPublisher } from '@/shared/infrastructure/console-domain-event-publisher';
import { CryptoIdGenerator } from '@/shared/infrastructure/crypto-id-generator';
import { DeferredDomainEventPublisher } from '@/shared/infrastructure/deferred-domain-event-publisher';
import { HashedRespondentIdentifier } from '@/shared/infrastructure/hashed-respondent-identifier';
import { IvyMessagerEmailSender } from '@/shared/infrastructure/messager/ivy-messager-email-sender';
import { SystemClock } from '@/shared/infrastructure/system-clock';
import type { RsvpRepository } from '../domain/rsvp.repository';
import { GetGuestRoster } from '../application/use-cases/get-guest-roster.use-case';
import { SubmitRsvp } from '../application/use-cases/submit-rsvp.use-case';
import { EmailNotifyingEventPublisher } from './notifications/email-notifying-event-publisher';
import { InMemoryRsvpRepository } from './persistence/in-memory-rsvp.repository';
import { NeonRsvpRepository } from './persistence/neon-rsvp.repository';

/**
 * Composition Root of the RSVP Bounded Context.
 *
 * The single place in the codebase where a concrete adapter is chosen and wired
 * to a port. Every other module depends on interfaces only, which is what makes
 * the Dependency Rule (nothing points inwards-to-outwards) actually hold.
 */
let repository: RsvpRepository | null = null;

function resolveRepository(): RsvpRepository {
  if (repository !== null) return repository;

  if (serverEnv.DATABASE_URL !== undefined) {
    repository = new NeonRsvpRepository(serverEnv.DATABASE_URL);
    return repository;
  }

  if (serverEnv.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL não configurada. Em produção as confirmações precisam de um banco ' +
        'durável. Defina a variável no projeto da Vercel antes do deploy.',
    );
  }

  console.warn(
    '[rsvp] DATABASE_URL ausente: usando repositório em memória. ' +
      'As confirmações serão perdidas ao reiniciar o servidor.',
  );
  repository = new InMemoryRsvpRepository();
  return repository;
}

/**
 * Salt padrão para o hash de aparelho.
 *
 * Existe para o projeto rodar sem configuração. Está no repositório, portanto
 * **não é segredo**. Defina `RSVP_DEVICE_SALT` na Vercel antes de publicar.
 */
const FALLBACK_DEVICE_SALT = 'ivy-2-anos-lago-encantado-salt-padrao';

/**
 * URL pública do convite, para o botão dos e-mails.
 *
 * A Vercel expõe o domínio de produção numa variável própria, então em deploy
 * normal não há nada a configurar. `INVITATION_URL` existe para domínio próprio
 * ou outra hospedagem, e o localhost fecha a lista para o envio funcionar em
 * desenvolvimento.
 */
function resolveInvitationUrl(): string {
  if (serverEnv.INVITATION_URL !== undefined) return serverEnv.INVITATION_URL;
  if (serverEnv.VERCEL_PROJECT_PRODUCTION_URL !== undefined) {
    return `https://${serverEnv.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Quem recebe o relatorio a cada resposta.
 *
 * `RSVP_ADMIN_EMAILS` e o nome atual. `RSVP_NOTIFY_EMAILS` continua aceito para
 * nao quebrar um ambiente ja cadastrado: renomear variavel de ambiente e o tipo
 * de mudanca que derruba producao em silencio.
 */
function resolveAdminRecipients(): readonly string[] {
  return (serverEnv.RSVP_ADMIN_EMAILS ?? serverEnv.RSVP_NOTIFY_EMAILS ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter((address) => address.length > 0);
}

/**
 * Monta os assinantes de evento de domínio.
 *
 * Sempre inclui o log de auditoria. O assinante de e-mail entra só quando há
 * token: sem ele, notificação é desligada e o convite continua aceitando
 * confirmações normalmente, porque avisar é melhoria, não requisito.
 *
 * O conjunto todo é embrulhado em `DeferredDomainEventPublisher`, então nada
 * disso acontece antes de o convidado receber a resposta.
 */
function resolveEventPublisher(): DomainEventPublisher {
  const subscribers: DomainEventPublisher[] = [new ConsoleDomainEventPublisher()];

  if (serverEnv.IVY_MESSAGER_TOKEN !== undefined) {
    subscribers.push(
      new EmailNotifyingEventPublisher({
        emails: new IvyMessagerEmailSender({
          baseUrl: serverEnv.IVY_MESSAGER_BASE_URL,
          token: serverEnv.IVY_MESSAGER_TOKEN,
        }),
        invitationUrl: resolveInvitationUrl(),
        adminRecipients: resolveAdminRecipients(),
        // O relatorio precisa do estado atual da lista, que o evento nao carrega.
        roster: new GetGuestRoster({ rsvps: resolveRepository() }),
      }),
    );
  } else if (serverEnv.NODE_ENV === 'production') {
    console.warn(
      '[rsvp] IVY_MESSAGER_TOKEN ausente: nenhum e-mail será enviado. ' +
        'Confirmações continuam sendo gravadas.',
    );
  }

  return new DeferredDomainEventPublisher(new CompositeDomainEventPublisher(subscribers));
}

/** Builds the `SubmitRsvp` Use Case with production adapters. */
export function makeSubmitRsvp(): SubmitRsvp {
  return new SubmitRsvp({
    rsvps: resolveRepository(),
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
    events: resolveEventPublisher(),
    respondents: new HashedRespondentIdentifier(resolveDeviceSalt()),
  });
}

/** Segredo usado tanto para o digest quanto para assinar o cookie de sessão. */
export function resolveDeviceSalt(): string {
  return serverEnv.RSVP_DEVICE_SALT ?? FALLBACK_DEVICE_SALT;
}
