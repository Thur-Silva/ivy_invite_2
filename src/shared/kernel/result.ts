/**
 * Shared Kernel. Explicit success/failure envelope.
 *
 * Used at the Application layer boundary so that Use Cases never leak
 * exceptions into the Presentation layer: a failure is data, and the caller is
 * forced by the type system to handle it. See ADR-0008.
 */
export type Result<TValue, TError> =
  { readonly ok: true; readonly value: TValue } | { readonly ok: false; readonly error: TError };

export function ok<TValue>(value: TValue): { ok: true; value: TValue } {
  return { ok: true, value };
}

export function fail<TError>(error: TError): { ok: false; error: TError } {
  return { ok: false, error };
}
