import { beforeEach, describe, expect, it } from 'vitest';
import type { RespondentSignals } from '@/shared/application/ports/respondent-identifier';
import {
  FixedClock,
  RecordingEventPublisher,
  SequentialIdGenerator,
  StubRespondentIdentifier,
} from '@/shared/testing/test-doubles';
import type { AuthenticatedAccount } from '../dto/submit-rsvp.dto';
import { InMemoryRsvpRepository } from '../../infrastructure/persistence/in-memory-rsvp.repository';
import { SubmitRsvp } from './submit-rsvp.use-case';

const MARIA: AuthenticatedAccount = {
  provider: 'google',
  subject: 'google-oauth|1001',
  email: 'maria.clara@gmail.com',
  displayName: 'Maria Clara Souza',
};

const JOAO: AuthenticatedAccount = {
  provider: 'facebook',
  subject: 'facebook|2002',
  email: 'joao.pedro@outlook.com',
  displayName: 'João Pedro',
};

/** Celular da Maria, no Wi-Fi de casa. */
const MARIA_PHONE: RespondentSignals = {
  sessionToken: 'token-maria',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2)',
  acceptLanguage: 'pt-BR',
  clientTraits: '390x844|30|300|America/Sao_Paulo',
  networkAddress: '189.10.10.1',
};

/**
 * Critérios de aceite do PBI-02 (confirmar presença) e do PBI-20 (login),
 * executáveis. Roda contra o repositório em memória, sem banco.
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

  const submit = (overrides: {
    guestName: string;
    decision: string;
    account?: AuthenticatedAccount;
    respondent?: RespondentSignals;
  }) =>
    useCase.execute({
      guestName: overrides.guestName,
      decision: overrides.decision,
      account: overrides.account ?? MARIA,
      respondent: overrides.respondent ?? MARIA_PHONE,
    });

  it('records a first "vou" and publishes RsvpConfirmed', async () => {
    const result = await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });

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
    const result = await submit({ guestName: 'João', decision: 'NOT_ATTENDING', account: JOAO });

    expect(result.ok).toBe(true);
    expect(events.names()).toEqual(['RsvpDeclined']);
  });

  it('guarda a conta verificada junto da resposta', async () => {
    await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });

    const account = rsvps.snapshot()[0]?.account;
    expect(account?.provider).toBe('GOOGLE');
    expect(account?.subject).toBe('google-oauth|1001');
    expect(account?.email).toBe('maria.clara@gmail.com');
  });

  it('stores opaque digests, never the raw signals', async () => {
    await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });

    const identity = rsvps.snapshot()[0]?.identity;
    expect(identity?.token).toHaveLength(64);
    expect(identity?.device).toHaveLength(64);
    expect(identity?.network).toHaveLength(64);

    const serialized = JSON.stringify([identity?.token, identity?.device, identity?.network]);
    expect(serialized).not.toContain(MARIA_PHONE.networkAddress);
    expect(serialized).not.toContain('iPhone');
  });

  describe('mesma conta voltando', () => {
    it('updates instead of duplicating when the guest changes their mind', async () => {
      await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });
      events.published.length = 0;
      clock.advanceMinutes(90);

      const result = await submit({ guestName: 'MARIA CLARA', decision: 'NOT_ATTENDING' });

      expect(result.ok && result.value.status).toBe('UPDATED');
      expect(result.ok && result.value.rsvpId).toBe('rsvp-1');
      expect(rsvps.snapshot()).toHaveLength(1);
      expect(events.names()).toEqual(['RsvpDecisionChanged']);
    });

    it('is idempotent when the same answer is sent twice', async () => {
      await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });
      events.published.length = 0;

      const result = await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });

      expect(result.ok && result.value.status).toBe('UNCHANGED');
      expect(events.published).toHaveLength(0);
      expect(rsvps.snapshot()).toHaveLength(1);
    });

    it('reconhece a conta mesmo trocando de aparelho e de rede', async () => {
      await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });

      // Respondeu do celular, agora está no notebook, em outra rede.
      const result = await submit({
        guestName: 'Maria Clara',
        decision: 'NOT_ATTENDING',
        respondent: {
          sessionToken: 'outro-token',
          userAgent: 'Mozilla/5.0 (Macintosh)',
          acceptLanguage: 'pt-BR',
          clientTraits: '1440x900|24|200|America/Sao_Paulo',
          networkAddress: '177.55.99.4',
        },
      });

      expect(result.ok && result.value.status).toBe('UPDATED');
      expect(rsvps.snapshot()).toHaveLength(1);
    });

    it('deixa a pessoa corrigir o nome que veio preenchido', async () => {
      await submit({ guestName: 'Maria', decision: 'ATTENDING' });

      // O palpite do e-mail era "Maria"; ela prefere o apelido.
      const result = await submit({ guestName: 'Mariazinha', decision: 'ATTENDING' });

      expect(result.ok).toBe(true);
      expect(rsvps.snapshot()).toHaveLength(1);
      expect(rsvps.snapshot()[0]?.guestName.value).toBe('Mariazinha');
    });
  });

  describe('uma resposta por convidado', () => {
    /**
     * O caso que motivou trocar o bloqueio por aparelho pelo bloqueio por conta.
     * Mãe e pai que dividem o mesmo celular são duas pessoas, e cada uma tem
     * direito à sua resposta. A regra antiga reprovava a segunda.
     */
    it('deixa duas contas responderem do MESMO aparelho', async () => {
      const primeira = await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });
      const segunda = await submit({
        guestName: 'João Pedro',
        decision: 'ATTENDING',
        account: JOAO,
        respondent: MARIA_PHONE,
      });

      expect(primeira.ok && primeira.value.status).toBe('RECORDED');
      expect(segunda.ok && segunda.value.status).toBe('RECORDED');
      expect(rsvps.snapshot()).toHaveLength(2);
    });

    it('recusa um nome que outra conta já usou, sem sobrescrever', async () => {
      await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });

      const result = await submit({
        guestName: 'maria clara',
        decision: 'NOT_ATTENDING',
        account: JOAO,
      });

      expect(result).toMatchObject({
        ok: false,
        error: { kind: 'NAME_TAKEN', code: 'GUEST_ALREADY_RESPONDED' },
      });
      expect(rsvps.snapshot()).toHaveLength(1);
      expect(rsvps.snapshot()[0]?.isAttending()).toBe(true);
    });

    it('trata o mesmo subject em provedores diferentes como pessoas diferentes', async () => {
      await submit({ guestName: 'Maria Clara', decision: 'ATTENDING' });

      const result = await submit({
        guestName: 'Outra Pessoa',
        decision: 'ATTENDING',
        account: { ...MARIA, provider: 'facebook', email: 'outra@facebook.com' },
      });

      expect(result.ok && result.value.status).toBe('RECORDED');
      expect(rsvps.snapshot()).toHaveLength(2);
    });
  });

  it('returns a fixable failure for an invalid name, without storing anything', async () => {
    const result = await submit({ guestName: 'A', decision: 'ATTENDING' });

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'VALIDATION', code: 'INVALID_GUEST_NAME', field: 'guestName' },
    });
    expect(rsvps.snapshot()).toHaveLength(0);
    expect(events.published).toHaveLength(0);
  });

  it('returns a fixable failure for an unknown decision', async () => {
    const result = await submit({ guestName: 'Maria Clara', decision: 'MAYBE' });

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'VALIDATION', code: 'UNKNOWN_ATTENDANCE_DECISION', field: 'decision' },
    });
    expect(rsvps.snapshot()).toHaveLength(0);
  });

  it('trata conta malformada como falha técnica, não como erro de formulário', async () => {
    const result = await submit({
      guestName: 'Maria Clara',
      decision: 'ATTENDING',
      account: { ...MARIA, subject: '' },
    });

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'UNAVAILABLE', code: 'RSVP_STORAGE_UNAVAILABLE' },
    });
    expect(rsvps.snapshot()).toHaveLength(0);
  });

  it('never throws when the repository is down. It reports UNAVAILABLE', async () => {
    const brokenUseCase = new SubmitRsvp({
      rsvps: {
        findByAccount: async () => {
          throw new Error('connection reset');
        },
        findByGuestKey: async () => null,
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
      account: MARIA,
      respondent: MARIA_PHONE,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'UNAVAILABLE', code: 'RSVP_STORAGE_UNAVAILABLE' },
    });
  });
});
