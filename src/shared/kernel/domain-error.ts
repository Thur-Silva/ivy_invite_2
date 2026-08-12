/**
 * Shared Kernel. Base class for broken domain invariants.
 *
 * Domain errors are *expected* business outcomes, not crashes. They carry a
 * stable machine-readable `code` (used by the Application layer to translate
 * the failure into a user-facing message) plus a message written in the
 * Ubiquitous Language. See ADR-0008 for why invariants throw instead of
 * returning `Result` inside the Domain layer.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Narrowing helper for the Application layer's error boundary. */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
