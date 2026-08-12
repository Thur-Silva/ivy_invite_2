import type { Clock } from '@/shared/application/ports/clock';
import type {
  RespondentDigests,
  RespondentIdentifier,
  RespondentSignals,
} from '@/shared/application/ports/respondent-identifier';
import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { IdGenerator } from '@/shared/application/ports/id-generator';
import type { DomainEvent } from '@/shared/kernel/domain-event';

/** Time stands still, so assertions on timestamps are exact. */
export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

/** Predictable ids: `rsvp-1`, `rsvp-2`, … */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = 'rsvp') {}

  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}

/**
 * Identidade previsível: cada sinal vira hex legível repetido até 64 caracteres.
 *
 * Não usa crypto de propósito. Os testes precisam que "o celular da Maria" e
 * "o celular do João" sejam distinguíveis na saída de uma asserção que falhou.
 * O contrato que importa é apenas "mesmo sinal, mesmo digest".
 */
export class StubRespondentIdentifier implements RespondentIdentifier {
  identify(signals: RespondentSignals): RespondentDigests {
    return {
      token: toDigest(signals.sessionToken),
      device: toDigest([signals.userAgent, signals.acceptLanguage, signals.clientTraits].join('~')),
      network: toDigest(signals.networkAddress),
    };
  }
}

function toDigest(value: string): string {
  let hex = '';
  for (const char of value.trim().toLowerCase()) {
    hex += char.charCodeAt(0).toString(16).padStart(2, '0');
  }
  if (hex.length === 0) hex = '00';
  return hex.repeat(Math.ceil(64 / hex.length)).slice(0, 64);
}

/** Spy that keeps every published event so tests can assert on them. */
export class RecordingEventPublisher implements DomainEventPublisher {
  readonly published: DomainEvent[] = [];

  async publish(events: readonly DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }

  names(): string[] {
    return this.published.map((event) => event.name);
  }
}
