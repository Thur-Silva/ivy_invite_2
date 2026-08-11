import { describe, expect, it } from 'vitest';
import { Rsvp } from './rsvp.aggregate';
import { AttendanceDecision } from './value-objects/attendance-decision';
import { RespondentIdentity } from './value-objects/respondent-identity';
import { GuestName } from './value-objects/guest-name';
import { RsvpId } from './value-objects/rsvp-id';

const ID = RsvpId.fromString('rsvp-1');
const RESPONDED_AT = new Date('2026-08-11T14:00:00Z');
const LATER = new Date('2026-08-12T09:30:00Z');

const IDENTITY = RespondentIdentity.fromDigests({
  token: 'a'.repeat(64),
  device: 'b'.repeat(64),
  network: 'c'.repeat(64),
});

function submit(decision: AttendanceDecision, name = 'Maria Clara'): Rsvp {
  return Rsvp.submit({
    id: ID,
    guestName: GuestName.create(name),
    decision,
    identity: IDENTITY,
    respondedAt: RESPONDED_AT,
  });
}

describe('Rsvp', () => {
  it('raises RsvpConfirmed when the guest is coming', () => {
    const rsvp = submit(AttendanceDecision.ATTENDING);

    expect(rsvp.isAttending()).toBe(true);
    expect(rsvp.pullDomainEvents().map((event) => event.name)).toEqual(['RsvpConfirmed']);
  });

  it('raises RsvpDeclined when the guest cannot come', () => {
    const rsvp = submit(AttendanceDecision.NOT_ATTENDING);

    expect(rsvp.isAttending()).toBe(false);
    expect(rsvp.pullDomainEvents().map((event) => event.name)).toEqual(['RsvpDeclined']);
  });

  it('drains its event buffer only once', () => {
    const rsvp = submit(AttendanceDecision.ATTENDING);

    expect(rsvp.pullDomainEvents()).toHaveLength(1);
    expect(rsvp.pullDomainEvents()).toHaveLength(0);
  });

  it('records when and by whom it was answered', () => {
    const rsvp = submit(AttendanceDecision.ATTENDING);

    expect(rsvp.respondedAt).toEqual(RESPONDED_AT);
    expect(rsvp.updatedAt).toEqual(RESPONDED_AT);
    expect(rsvp.guestKey.value).toBe('maria-clara');
  });

  describe('reconsider', () => {
    it('raises RsvpDecisionChanged and keeps the original response time', () => {
      const rsvp = submit(AttendanceDecision.ATTENDING);
      rsvp.pullDomainEvents();

      rsvp.reconsider({
        guestName: GuestName.create('Maria Clara'),
        decision: AttendanceDecision.NOT_ATTENDING,
        identity: IDENTITY,
        changedAt: LATER,
      });

      const events = rsvp.pullDomainEvents();
      expect(events.map((event) => event.name)).toEqual(['RsvpDecisionChanged']);
      expect(events[0]?.payload()).toMatchObject({
        previousDecision: 'ATTENDING',
        currentDecision: 'NOT_ATTENDING',
      });
      expect(rsvp.isAttending()).toBe(false);
      expect(rsvp.respondedAt).toEqual(RESPONDED_AT);
      expect(rsvp.updatedAt).toEqual(LATER);
    });

    it('is idempotent: resending the same answer changes nothing', () => {
      const rsvp = submit(AttendanceDecision.ATTENDING);
      rsvp.pullDomainEvents();

      rsvp.reconsider({
        guestName: GuestName.create('Maria Clara'),
        decision: AttendanceDecision.ATTENDING,
        identity: IDENTITY,
        changedAt: LATER,
      });

      expect(rsvp.pullDomainEvents()).toHaveLength(0);
      expect(rsvp.updatedAt).toEqual(RESPONDED_AT);
    });

    it('adopts the latest spelling of the name without raising an event', () => {
      const rsvp = submit(AttendanceDecision.ATTENDING, 'maria clara');
      rsvp.pullDomainEvents();

      rsvp.reconsider({
        guestName: GuestName.create('Maria Clara'),
        decision: AttendanceDecision.ATTENDING,
        identity: IDENTITY,
        changedAt: LATER,
      });

      expect(rsvp.guestName.value).toBe('Maria Clara');
      expect(rsvp.guestKey.value).toBe('maria-clara');
      expect(rsvp.pullDomainEvents()).toHaveLength(0);
      expect(rsvp.updatedAt).toEqual(LATER);
    });
  });

  it('rehydrates from storage without replaying history', () => {
    const rsvp = Rsvp.rehydrate({
      id: ID,
      guestName: GuestName.create('Maria Clara'),
      decision: AttendanceDecision.ATTENDING,
      identity: IDENTITY,
      respondedAt: RESPONDED_AT,
      updatedAt: LATER,
    });

    expect(rsvp.pullDomainEvents()).toHaveLength(0);
    expect(rsvp.updatedAt).toEqual(LATER);
  });

  it('keeps the originating device when the guest changes their mind', () => {
    const rsvp = submit(AttendanceDecision.ATTENDING);

    rsvp.reconsider({
      guestName: GuestName.create('Maria Clara'),
      decision: AttendanceDecision.NOT_ATTENDING,
      identity: IDENTITY,
      changedAt: LATER,
    });

    // A resposta pertence a quem a criou: mudar de ideia não transfere a posse.
    expect(rsvp.identity.equals(IDENTITY)).toBe(true);
  });
});
