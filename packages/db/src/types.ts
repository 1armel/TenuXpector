/**
 * Shared domain types for the U2 foundation persistence layer.
 * Money and quantities are integers only (DEC-04).
 */

export const USER_ROLES = ['vendeur', 'gerant', 'proprietaire'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BASE_UNIT_CONVERSION_FACTOR = 1000;
export const MIN_PIN_ITERATIONS = 310_000;
export const PIN_LOCKOUT_FAILURES = 5;
export const PIN_LOCKOUT_WINDOW_MS = 10 * 60 * 1000;

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export class TenantIsolationError extends Error {
  constructor(readonly expectedTenantId: string, readonly actualTenantId: string) {
    super(
      `Tenant isolation violation: expected ${expectedTenantId}, got ${actualTenantId} [BR1.5]`,
    );
    this.name = 'TenantIsolationError';
  }
}

export class AppendOnlyViolationError extends Error {
  constructor(readonly table: string) {
    super(`Append-only violation on ${table} [BR1.3]`);
    this.name = 'AppendOnlyViolationError';
  }
}

export class MissingOutboxError extends Error {
  constructor() {
    super('Business mutation requires an OutboxEvent in the same transaction [BR4.2]');
    this.name = 'MissingOutboxError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface TenantContext {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly deviceId: string;
}
