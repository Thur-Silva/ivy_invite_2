import 'server-only';
import { serverEnv } from '@/shared/config/server-env';
import { ConsoleDomainEventPublisher } from '@/shared/infrastructure/console-domain-event-publisher';
import { CryptoIdGenerator } from '@/shared/infrastructure/crypto-id-generator';
import { SystemClock } from '@/shared/infrastructure/system-clock';
import type { RsvpRepository } from '../domain/rsvp.repository';
import { SubmitRsvp } from '../application/use-cases/submit-rsvp.use-case';
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
      'DATABASE_URL não configurada. Em produção as confirmações precisam de um banco durável — ' +
        'defina a variável no projeto da Vercel antes do deploy.',
    );
  }

  console.warn(
    '[rsvp] DATABASE_URL ausente: usando repositório em memória. ' +
      'As confirmações serão perdidas ao reiniciar o servidor.',
  );
  repository = new InMemoryRsvpRepository();
  return repository;
}

/** Builds the `SubmitRsvp` Use Case with production adapters. */
export function makeSubmitRsvp(): SubmitRsvp {
  return new SubmitRsvp({
    rsvps: resolveRepository(),
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
    events: new ConsoleDomainEventPublisher(),
  });
}
