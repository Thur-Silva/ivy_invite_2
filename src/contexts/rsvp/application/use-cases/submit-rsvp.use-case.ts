import type { Clock } from '@/shared/application/ports/clock';
import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { IdGenerator } from '@/shared/application/ports/id-generator';
import { isDomainError } from '@/shared/kernel/domain-error';
import { fail, ok, type Result } from '@/shared/kernel/result';
import { Rsvp } from '../../domain/rsvp.aggregate';
import type { RsvpRepository } from '../../domain/rsvp.repository';
import { AttendanceDecision } from '../../domain/value-objects/attendance-decision';
import { GuestName } from '../../domain/value-objects/guest-name';
import { RsvpId } from '../../domain/value-objects/rsvp-id';
import type {
  SubmissionStatus,
  SubmitRsvpCommand,
  SubmitRsvpFailure,
  SubmitRsvpField,
  SubmitRsvpOutcome,
} from '../dto/submit-rsvp.dto';

export interface SubmitRsvpDependencies {
  readonly rsvps: RsvpRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly events: DomainEventPublisher;
}

type SubmitRsvpResult = Result<SubmitRsvpOutcome, SubmitRsvpFailure>;

/**
 * Use Case — "a guest answers Ivy's invitation".
 *
 * Orchestration only; every business rule lives in the aggregate and its Value
 * Objects. Responsibilities, in order:
 *
 *  1. translate primitives into Value Objects (invariants enforced here);
 *  2. recognise a returning guest by natural key;
 *  3. delegate the state change to the aggregate;
 *  4. persist the aggregate;
 *  5. publish the events the aggregate raised — only after step 4 succeeded;
 *  6. return a `Result`, never throw, so the caller must handle failure.
 */
export class SubmitRsvp {
  constructor(private readonly deps: SubmitRsvpDependencies) {}

  async execute(command: SubmitRsvpCommand): Promise<SubmitRsvpResult> {
    try {
      const guestName = this.parse(() => GuestName.create(command.guestName), 'guestName');
      if (!guestName.ok) return guestName;

      const decision = this.parse(() => AttendanceDecision.fromValue(command.decision), 'decision');
      if (!decision.ok) return decision;

      return await this.record(guestName.value, decision.value);
    } catch (error) {
      // Anything reaching here is a defect or an infrastructure outage — never
      // a business outcome. The guest gets one honest, retryable message.
      console.error('[rsvp] falha ao registrar confirmação', error);
      return fail({
        kind: 'UNAVAILABLE',
        code: 'RSVP_STORAGE_UNAVAILABLE',
        message: 'Não conseguimos guardar sua resposta agora. Tente novamente em instantes.',
      });
    }
  }

  private async record(
    guestName: GuestName,
    decision: AttendanceDecision,
  ): Promise<SubmitRsvpResult> {
    const now = this.deps.clock.now();
    const existing = await this.deps.rsvps.findByGuestKey(guestName.key());

    let rsvp: Rsvp;
    let status: SubmissionStatus;

    if (existing === null) {
      rsvp = Rsvp.submit({
        id: RsvpId.fromString(this.deps.ids.generate()),
        guestName,
        decision,
        respondedAt: now,
      });
      status = 'RECORDED';
    } else {
      rsvp = existing;
      status = rsvp.decision.equals(decision) ? 'UNCHANGED' : 'UPDATED';
      rsvp.reconsider({ guestName, decision, changedAt: now });
    }

    await this.deps.rsvps.save(rsvp);

    // Events are drained after the write so nothing is announced for work that
    // never landed, and a notification failure never fails a stored RSVP.
    const events = rsvp.pullDomainEvents();
    if (events.length > 0) {
      await this.deps.events.publish(events).catch((error: unknown) => {
        console.error('[rsvp] falha ao publicar eventos de domínio', error);
      });
    }

    return ok({
      rsvpId: rsvp.id.value,
      guestFirstName: rsvp.guestName.firstName(),
      decision: rsvp.decision.value,
      status,
    });
  }

  /**
   * Runs a Value Object factory and turns a broken invariant into a fixable
   * form error. Non-domain errors are defects and are rethrown to `execute`.
   */
  private parse<T>(factory: () => T, field: SubmitRsvpField): Result<T, SubmitRsvpFailure> {
    try {
      return ok(factory());
    } catch (error) {
      if (!isDomainError(error)) throw error;
      return fail({ kind: 'VALIDATION', code: error.code, message: error.message, field });
    }
  }
}
