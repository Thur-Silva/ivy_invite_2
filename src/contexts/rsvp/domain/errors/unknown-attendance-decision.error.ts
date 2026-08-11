import { DomainError } from '@/shared/kernel/domain-error';

export class UnknownAttendanceDecisionError extends DomainError {
  readonly code = 'UNKNOWN_ATTENDANCE_DECISION' as const;

  constructor(readonly received: string) {
    super(`"${received}" não é uma resposta válida. Use "vou" ou "não vou".`);
  }
}
