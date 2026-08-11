import { beforeEach, describe, expect, it } from 'vitest';
import {
  FixedClock,
  RecordingEventPublisher,
  SequentialIdGenerator,
} from '@/shared/testing/test-doubles';
import { InMemoryRsvpRepository } from '../../infrastructure/persistence/in-memory-rsvp.repository';
import { SubmitRsvp } from './submit-rsvp.use-case';

/**
 * Acceptance criteria of PBI-02 ("como convidado, quero confirmar presença"),
 * executable. Runs against the in-memory repository — no database involved.
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
    useCase = new SubmitRsvp({ rsvps, clock, ids: new SequentialIdGenerator(), events });
  });

  it('records a first "vou" and publishes RsvpConfirmed', async () => {
    const result = await useCase.execute({ guestName: 'Maria Clara', decision: 'ATTENDING' });

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
    const result = await useCase.execute({ guestName: 'João', decision: 'NOT_ATTENDING' });

    expect(result.ok).toBe(true);
    expect(events.names()).toEqual(['RsvpDeclined']);
  });

  it('updates instead of duplicating when the guest changes their mind', async () => {
    await useCase.execute({ guestName: 'Maria Clara', decision: 'ATTENDING' });
    events.published.length = 0;
    clock.advanceMinutes(90);

    const result = await useCase.execute({ guestName: 'MARIA CLARA', decision: 'NOT_ATTENDING' });

    expect(result.ok && result.value.status).toBe('UPDATED');
    expect(result.ok && result.value.rsvpId).toBe('rsvp-1');
    expect(rsvps.snapshot()).toHaveLength(1);
    expect(events.names()).toEqual(['RsvpDecisionChanged']);
  });

  it('is idempotent when the same answer is sent twice', async () => {
    await useCase.execute({ guestName: 'Maria Clara', decision: 'ATTENDING' });
    events.published.length = 0;

    const result = await useCase.execute({ guestName: 'Maria Clara', decision: 'ATTENDING' });

    expect(result.ok && result.value.status).toBe('UNCHANGED');
    expect(events.published).toHaveLength(0);
    expect(rsvps.snapshot()).toHaveLength(1);
  });

  it('keeps guests with different names apart', async () => {
    await useCase.execute({ guestName: 'Ana Paula', decision: 'ATTENDING' });
    await useCase.execute({ guestName: 'Ana Paulo', decision: 'NOT_ATTENDING' });

    expect(rsvps.snapshot()).toHaveLength(2);
  });

  it('returns a fixable failure for an invalid name, without storing anything', async () => {
    const result = await useCase.execute({ guestName: 'A', decision: 'ATTENDING' });

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'VALIDATION', code: 'INVALID_GUEST_NAME', field: 'guestName' },
    });
    expect(rsvps.snapshot()).toHaveLength(0);
    expect(events.published).toHaveLength(0);
  });

  it('returns a fixable failure for an unknown decision', async () => {
    const result = await useCase.execute({ guestName: 'Maria Clara', decision: 'MAYBE' });

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
        save: async () => undefined,
      },
      clock,
      ids: new SequentialIdGenerator(),
      events,
    });

    const result = await brokenUseCase.execute({
      guestName: 'Maria Clara',
      decision: 'ATTENDING',
    });

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'UNAVAILABLE', code: 'RSVP_STORAGE_UNAVAILABLE' },
    });
  });
});
