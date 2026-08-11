import type { Clock } from '@/shared/application/ports/clock';
import type { DomainEventPublisher } from '@/shared/application/ports/domain-event-publisher';
import type { IdGenerator } from '@/shared/application/ports/id-generator';
import type { RespondentIdentifier } from '@/shared/application/ports/respondent-identifier';
import { isDomainError } from '@/shared/kernel/domain-error';
import { fail, ok, type Result } from '@/shared/kernel/result';
import { Rsvp } from '../../domain/rsvp.aggregate';
import type { RsvpRepository } from '../../domain/rsvp.repository';
import { RsvpEligibilityPolicy } from '../../domain/services/rsvp-eligibility.policy';
import { AttendanceDecision } from '../../domain/value-objects/attendance-decision';
import { GuestName } from '../../domain/value-objects/guest-name';
import { RespondentIdentity } from '../../domain/value-objects/respondent-identity';
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
  readonly respondents: RespondentIdentifier;
}

type SubmitRsvpResult = Result<SubmitRsvpOutcome, SubmitRsvpFailure>;

/**
 * Use Case — "a guest answers Ivy's invitation".
 *
 * Orquestração apenas; toda regra vive no agregado, nos Value Objects e no
 * `RsvpEligibilityPolicy`. Na ordem:
 *
 *  1. traduz primitivos em Value Objects (invariantes acontecem aqui);
 *  2. transforma o endereço de rede numa impressão digital opaca;
 *  3. lê as duas identidades da resposta — por nome e por aparelho;
 *  4. pergunta à política de domínio o que fazer;
 *  5. cria, atualiza ou recusa;
 *  6. persiste e só então publica os eventos;
 *  7. devolve `Result`, nunca lança.
 */
export class SubmitRsvp {
  constructor(private readonly deps: SubmitRsvpDependencies) {}

  async execute(command: SubmitRsvpCommand): Promise<SubmitRsvpResult> {
    try {
      const guestName = this.parse(() => GuestName.create(command.guestName), 'guestName');
      if (!guestName.ok) return guestName;

      const decision = this.parse(() => AttendanceDecision.fromValue(command.decision), 'decision');
      if (!decision.ok) return decision;

      const identity = RespondentIdentity.fromDigests(
        this.deps.respondents.identify(command.respondent),
      );

      return await this.record(guestName.value, decision.value, identity);
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
    identity: RespondentIdentity,
  ): Promise<SubmitRsvpResult> {
    const now = this.deps.clock.now();

    // Duas leituras independentes, em paralelo: o driver HTTP do Neon faz uma
    // requisição por statement, então serializá-las dobraria a latência à toa.
    const [fromRespondent, underName] = await Promise.all([
      this.deps.rsvps.findByRespondent(identity),
      this.deps.rsvps.findByGuestKey(guestName.key()),
    ]);

    const eligibility = RsvpEligibilityPolicy.decide({ guestName, fromRespondent, underName });

    if (eligibility.kind === 'DEVICE_ALREADY_ANSWERED') {
      return fail({
        kind: 'DEVICE_LIMIT',
        code: 'DEVICE_ALREADY_RESPONDED',
        registeredGuestName: eligibility.registeredGuestName.value,
        message:
          `Este aparelho já confirmou presença como ${eligibility.registeredGuestName.value}. ` +
          'Cada convidado responde por si — peça para a outra pessoa responder pelo celular dela.',
      });
    }

    if (eligibility.kind === 'NAME_ANSWERED_ELSEWHERE') {
      return fail({
        kind: 'NAME_TAKEN',
        code: 'GUEST_ALREADY_RESPONDED',
        message:
          `Já existe uma resposta em nome de ${guestName.value}, enviada de outro aparelho. ` +
          'Para alterá-la, use o mesmo celular de antes ou fale com os anfitriões.',
      });
    }

    let rsvp: Rsvp;
    let status: SubmissionStatus;

    if (eligibility.kind === 'OWN_RESPONSE') {
      rsvp = eligibility.rsvp;
      status = rsvp.decision.equals(decision) ? 'UNCHANGED' : 'UPDATED';
      rsvp.reconsider({ guestName, decision, identity, changedAt: now });
    } else {
      rsvp = Rsvp.submit({
        id: RsvpId.fromString(this.deps.ids.generate()),
        guestName,
        decision,
        identity,
        respondedAt: now,
      });
      status = 'RECORDED';
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
