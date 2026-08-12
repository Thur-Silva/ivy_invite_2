import { describe, expect, it } from 'vitest';
import { Rsvp } from './rsvp.aggregate';
import { AttendanceDecision } from './value-objects/attendance-decision';
import { GuestAccount } from './value-objects/guest-account';
import { RespondentIdentity } from './value-objects/respondent-identity';
import { GuestName } from './value-objects/guest-name';
import { RsvpId } from './value-objects/rsvp-id';

const ID = RsvpId.fromString('rsvp-1');
const RESPONDED_AT = new Date('2026-08-11T14:00:00Z');
const LATER = new Date('2026-08-12T09:30:00Z');

/** Dentro do silêncio de 15 minutos entre anúncios. */
const TWO_MINUTES_LATER = new Date('2026-08-11T14:02:00Z');
const TEN_MINUTES_LATER = new Date('2026-08-11T14:10:00Z');
/** Primeiro instante fora do silêncio. */
const FIFTEEN_MINUTES_LATER = new Date('2026-08-11T14:15:00Z');

const ACCOUNT = GuestAccount.create({
  provider: 'google',
  subject: 'google|1001',
  email: 'maria.clara@gmail.com',
  displayName: 'Maria Clara',
});

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
    account: ACCOUNT,
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
        account: ACCOUNT,
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
        account: ACCOUNT,
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
        account: ACCOUNT,
        identity: IDENTITY,
        changedAt: LATER,
      });

      expect(rsvp.guestName.value).toBe('Maria Clara');
      expect(rsvp.guestKey.value).toBe('maria-clara');
      expect(rsvp.pullDomainEvents()).toHaveLength(0);
      expect(rsvp.updatedAt).toEqual(LATER);
    });
  });

  /**
   * Alternar entre "vou" e "não vou" é uma pessoa decidindo, não uma sequência
   * de notícias. O estado acompanha cada toque; o anúncio, não.
   */
  describe('vaivém entre vou e não vou', () => {
    const flip = (rsvp: Rsvp, decision: AttendanceDecision, changedAt: Date) =>
      rsvp.reconsider({
        guestName: GuestName.create('Maria Clara'),
        decision,
        account: ACCOUNT,
        identity: IDENTITY,
        changedAt: changedAt,
      });

    it('não anuncia nada quando a pessoa alterna e volta ao ponto de partida', () => {
      const rsvp = submit(AttendanceDecision.ATTENDING);
      rsvp.pullDomainEvents();

      flip(rsvp, AttendanceDecision.NOT_ATTENDING, TWO_MINUTES_LATER);
      flip(rsvp, AttendanceDecision.ATTENDING, TEN_MINUTES_LATER);

      expect(rsvp.pullDomainEvents()).toHaveLength(0);
      // O estado seguiu cada toque, mesmo sem ninguém ser avisado.
      expect(rsvp.isAttending()).toBe(true);
      expect(rsvp.updatedAt).toEqual(TEN_MINUTES_LATER);
    });

    it('cala durante o silêncio, mesmo terminando diferente', () => {
      const rsvp = submit(AttendanceDecision.ATTENDING);
      rsvp.pullDomainEvents();

      flip(rsvp, AttendanceDecision.NOT_ATTENDING, TWO_MINUTES_LATER);

      expect(rsvp.pullDomainEvents()).toHaveLength(0);
      expect(rsvp.isAttending()).toBe(false);
    });

    it('anuncia de novo depois que o silêncio passa', () => {
      const rsvp = submit(AttendanceDecision.ATTENDING);
      rsvp.pullDomainEvents();

      flip(rsvp, AttendanceDecision.NOT_ATTENDING, FIFTEEN_MINUTES_LATER);

      const events = rsvp.pullDomainEvents();
      expect(events.map((event) => event.name)).toEqual(['RsvpDecisionChanged']);
      expect(events[0]?.payload()).toMatchObject({
        previousDecision: 'ATTENDING',
        currentDecision: 'NOT_ATTENDING',
      });
    });

    it('as duas decisões anunciam igual: recusar não é mais silencioso que aceitar', () => {
      const recusou = submit(AttendanceDecision.NOT_ATTENDING);
      expect(recusou.pullDomainEvents().map((event) => event.name)).toEqual(['RsvpDeclined']);

      flip(recusou, AttendanceDecision.ATTENDING, FIFTEEN_MINUTES_LATER);
      expect(recusou.pullDomainEvents().map((event) => event.name)).toEqual([
        'RsvpDecisionChanged',
      ]);
    });

    it('conta o silêncio a partir do último anúncio, não do último toque', () => {
      const rsvp = submit(AttendanceDecision.ATTENDING);
      rsvp.pullDomainEvents();

      // Vaivém dentro do silêncio: nada anunciado, e o relógio do silêncio
      // continua correndo desde a resposta inicial.
      flip(rsvp, AttendanceDecision.NOT_ATTENDING, TWO_MINUTES_LATER);
      flip(rsvp, AttendanceDecision.ATTENDING, TEN_MINUTES_LATER);
      expect(rsvp.pullDomainEvents()).toHaveLength(0);

      // Se o relógio tivesse reiniciado a cada toque, isto ainda estaria calado.
      flip(rsvp, AttendanceDecision.NOT_ATTENDING, FIFTEEN_MINUTES_LATER);
      expect(rsvp.pullDomainEvents()).toHaveLength(1);
    });

    it('o "antes" do e-mail é o que a pessoa leu, não um estado intermediário', () => {
      const rsvp = submit(AttendanceDecision.ATTENDING);
      rsvp.pullDomainEvents();

      // Ninguém foi avisado desta: aconteceu dentro do silêncio.
      flip(rsvp, AttendanceDecision.NOT_ATTENDING, TWO_MINUTES_LATER);
      rsvp.pullDomainEvents();

      flip(rsvp, AttendanceDecision.ATTENDING, LATER);
      const events = rsvp.pullDomainEvents();

      // O último e-mail dizia ATTENDING, então voltar a ATTENDING não é notícia.
      expect(events).toHaveLength(0);
    });
  });

  it('rehydrates from storage without replaying history', () => {
    const rsvp = Rsvp.rehydrate({
      id: ID,
      guestName: GuestName.create('Maria Clara'),
      decision: AttendanceDecision.ATTENDING,
      account: ACCOUNT,
      identity: IDENTITY,
      respondedAt: RESPONDED_AT,
      updatedAt: LATER,
      announcedDecision: AttendanceDecision.ATTENDING,
      announcedAt: RESPONDED_AT,
    });

    expect(rsvp.pullDomainEvents()).toHaveLength(0);
    expect(rsvp.updatedAt).toEqual(LATER);
  });

  it('keeps the originating device when the guest changes their mind', () => {
    const rsvp = submit(AttendanceDecision.ATTENDING);

    rsvp.reconsider({
      guestName: GuestName.create('Maria Clara'),
      decision: AttendanceDecision.NOT_ATTENDING,
      account: ACCOUNT,
      identity: IDENTITY,
      changedAt: LATER,
    });

    // A resposta pertence a quem a criou: mudar de ideia não transfere a posse.
    expect(rsvp.identity.equals(IDENTITY)).toBe(true);
  });
});
