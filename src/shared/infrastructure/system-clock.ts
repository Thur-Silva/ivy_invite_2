import type { Clock } from '@/shared/application/ports/clock';

/** Adapter — the real wall clock. The only place `new Date()` is allowed. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
