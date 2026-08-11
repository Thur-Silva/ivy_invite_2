import { beforeEach, describe, expect, it } from 'vitest';
import type { RespondentSignals } from '@/shared/application/ports/respondent-identifier';
import {
  FixedClock,
  RecordingEventPublisher,
  SequentialIdGenerator,
  StubRespondentIdentifier,
} from '@/shared/testing/test-doubles';
import { InMemoryRsvpRepository } from '../../infrastructure/persistence/in-memory-rsvp.repository';
import { SubmitRsvp } from './submit-rsvp.use-case';

/** Celular da Maria, no Wi-Fi de casa. */
const MARIA_PHONE: RespondentSignals = {
  sessionToken: 'token-maria',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2)',
  acceptLanguage: 'pt-BR',
  clientTraits: '390x844|30|300|America/Sao_Paulo',
  networkAddress: '189.10.10.1',
};

/** Celular do João — aparelho diferente, **mesma rede** que o da Maria. */
const JOAO_PHONE: RespondentSignals = {
  sessionToken: 'token-joao',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Moto G84)',
  acceptLanguage: 'pt-BR',
  clientTraits: '412x915|24|275|America/Sao_Paulo',
  networkAddress: '189.10.10.1',
};

/**
 * Critérios de aceite do PBI-02 (confirmar presença) e do PBI-19 (uma resposta
 * por convidado), executáveis. Roda contra o repositório em memória — sem banco.
 */
describe('SubmitRsvp', () => {
  let rsvps: InMemoryRsvpRepository;
  let clock: FixedClock;
  let events: RecordingEventPublisher;
  let useCase: SubmitRsvp;

  beforeEach(() => {
    rsvps = new InMemoryRsvpRepository();
    clock = new FixedClock(new Date('2026-08-11T14:00:00Z'));
    events = new RecordingEventPublisher();
    useCase = new SubmitRsvp({
      rsvps,
      clock,
      ids: new SequentialIdGenerator(),
      events,
      respondents: new StubRespondentIdentifier(),
    });
  });

  it('records a first "vou" and publishes RsvpConfirmed', async () => {
    const result = await useCase.execute({
      guestName: 'Maria Clara',
      decision: 'ATTENDING',
      respondent: MARIA_PHONE,
    });

    expect(result).toEqual({
      ok: true,
      value: {
        rsvpId: 'rsvp-1',
        guestFirstName: 'Maria',
        decision: 'ATTENDING',
        status: 'RECORDED',
      },
    });
    expect(events.names()).toEqual(['RsvpConfirmed']);
    expect(rsvps.snapshot()).toHaveLength(1);
  });

  it('records a first "não vou" and publishes RsvpDeclined', async () => {
    const result = await useCase.execute({
      guestName: 'João',
      decision: 'NOT_ATTENDING',
      respondent: MARIA_PHONE,
    });

    expect(result.ok).toBe(true);
    expect(events.names()).toEqual(['RsvpDeclined']);
  });

  it('stores opaque digests, never the raw signals', async () => {
    await useCase.execute({
      guestName: 'Maria Clara',
      decision: 'ATTENDING',
      respondent: MARIA_PHONE,
    });

    const identity = rsvps.snapshot()[0]?.identity;
    expect(identity?.token).toHaveLength(64);
    expect(identity?.device).toHaveLength(64);
    expect(identity?.network).toHaveLength(64);

    const serialized = JSON.stringify([identity?.token, identity?.device, identity?.network]);
    expect(serialized).not.toContain(MARIA_PHONE.networkAddress);
    expect(serialized).not.toContain('iPhone');
  });

  describe('mesmo convidado voltando', () => {
    it('updates instead of duplicating when the guest changes their mind', async () => {
      await useCase.execute({
        guestName: 'Maria Clara',
        decision: 'ATTENDING',
        respondent: MARIA_PHONE,
      });
      events.published.length = 0;
      clock.advanceMinutes(90);

      const result = await useCase.execute({
        guestName: 'MARIA CLARA',
        decision: 'NOT_ATTENDING',
        respondent: MARIA_PHONE,
      });

      expect(result.ok && result.value.status).toBe('UPDATED');
      expect(result.ok && result.value.rsvpId).toBe('rsvp-1');
      expect(rsvps.snapshot()).toHaveLength(1);
      expect(events.names()).toEqual(['RsvpDecisionChanged']);
    });

    it('is idempotent when the same answer is sent twice', async () => {
      await useCase.execute({
        guestName: 'Maria Clara',
        decision: 'ATTENDING',
        respondent: MARIA_PHONE,
      });
      events.published.length = 0;

      const result = await useCase.execute({
        guestName: 'Maria Clara',
        decision: 'ATTENDING',
        respondent: MARIA_PHONE,
      });

      expect(result.ok && result.value.status).toBe('UNCHANGED');
      expect(events.published).toHaveLength(0);
      expect(rsvps.snapshot()).toHaveLength(1);
    });

    it('recognises the guest by cookie even after the network changes', async () => {
      await useCase.execute({
        guestName: 'Maria Clara',
        decision: 'ATTENDING',
        respondent: MARIA_PHONE,
      });

      // Saiu do Wi-Fi e foi para o 4G: IP e traços de rede mudam, o token não.
      const result = await useCase.execute({
        guestName: 'Maria Clara',
        decision: 'NOT_ATTENDING',
        respondent: { ...MARIA_PHONE, networkAddress: '177.55.99.4' },
      });

      expect(result.ok && result.value.status).toBe('UPDATED');
      expect(rsvps.snapshot()).toHaveLength(1);
    });

    it('recognises the guest by device + network even after cookies are cleared', async () => {
      await useCase.execute({
        guestName: 'Maria Clara',
        decision: 'ATTENDING',
        respondent: MARIA_PHONE,
      });

      // Limpou os cookies: token novo, mas mesmo aparelho e mesma rede.
      const result = await useCase.execute({
        guestName: 'Outra Pessoa',
        decision: 'ATTENDING',
        respondent: { ...MARIA_PHONE, sessionToken: 'token-novo-em-folha' },
      });

      expect(result).toMatchObject({
        ok: false,
        error: { kind: 'DEVICE_LIMIT', registeredGuestName: 'Maria Clara' },
      });
    });
  });

  describe('uma resposta por convidado', () => {
    it('refuses a second person from the same device and says who is registered', async () => {
      await useCase.execute({
        guestName: 'Maria Clara',
        decision: 'ATTENDING',
        respondent: MARIA_PHONE,
      });
      events.published.length = 0;

      const result = await useCase.execute({
        guestName: 'João Pedro',
        decision: 'ATTENDING',
        respondent: MARIA_PHONE,
      });

      expect(result).toMatchObject({
        ok: false,
        error: {
          kind: 'DEVICE_LIMIT',
          code: 'DEVICE_ALREADY_RESPONDED',
          registeredGuestName: 'Maria Clara',
        },
      });
      expect(rsvps.snapshot()).toHaveLength(1);
      expect(events.published).toHaveLength(0);
    });

    it('refuses a name that already answered from another device', async () => {
      await useCase.execute({
        guestName: 'Maria Clara',
        decision: 'ATTENDING',
        respondent: MARIA_PHONE,
      });

      const result = await useCase.execute({
        guestName: 'maria clara',
        decision: 'NOT_ATTENDING',
        respondent: JOAO_PHONE,
      });

      expect(result).toMatchObject({
        ok: false,
        error: { kind: 'NAME_TAKEN', code: 'GUEST_ALREADY_RESPONDED' },
      });
      // A resposta original permanece intacta — ninguém sobrescreve ninguém.
      expect(rsvps.snapshot()).toHaveLength(1);
      expect(rsvps.snapshot()[0]?.isAttending()).toBe(true);
    });

    /**
     * O caso que justifica combinar os sinais em vez de bloquear por IP: no
     * CGNAT das operadoras e no Wi-Fi de casa, convidados diferentes dividem o
     * mesmo endereço. Bloquear por rede sozinha deixaria a família toda de fora.
     */
    it('lets two different phones on the SAME network both answer', async () => {
      const maria = await useCase.execute({
        guestName: 'Maria Clara',
        decision: 'ATTENDING',
        respondent: MARIA_PHONE,
      });
      const joao = await useCase.execute({
        guestName: 'João Pedro',
        decision: 'ATTENDING',
        respondent: JOAO_PHONE,
      });

      expect(maria.ok && maria.value.status).toBe('RECORDED');
      expect(joao.ok && joao.value.status).toBe('RECORDED');
      expect(rsvps.snapshot()).toHaveLength(2);
    });
  });

  it('returns a fixable failure for an invalid name, without storing anything', async () => {
    const result = await useCase.execute({
      guestName: 'A',
      decision: 'ATTENDING',
      respondent: MARIA_PHONE,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'VALIDATION', code: 'INVALID_GUEST_NAME', field: 'guestName' },
    });
    expect(rsvps.snapshot()).toHaveLength(0);
    expect(events.published).toHaveLength(0);
  });

  it('returns a fixable failure for an unknown decision', async () => {
    const result = await useCase.execute({
      guestName: 'Maria Clara',
      decision: 'MAYBE',
      respondent: MARIA_PHONE,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'VALIDATION', code: 'UNKNOWN_ATTENDANCE_DECISION', field: 'decision' },
    });
    expect(rsvps.snapshot()).toHaveLength(0);
  });

  it('never throws when the repository is down — it reports UNAVAILABLE', async () => {
    const brokenUseCase = new SubmitRsvp({
      rsvps: {
        findByGuestKey: async () => {
          throw new Error('connection reset');
        },
        findByRespondent: async () => null,
        save: async () => undefined,
      },
      clock,
      ids: new SequentialIdGenerator(),
      events,
      respondents: new StubRespondentIdentifier(),
    });

    const result = await brokenUseCase.execute({
      guestName: 'Maria Clara',
      decision: 'ATTENDING',
      respondent: MARIA_PHONE,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'UNAVAILABLE', code: 'RSVP_STORAGE_UNAVAILABLE' },
    });
  });
});
