/**
 * Internal code uniqueness and generation [BR3.1].
 */
import { err, ok, type Result } from '../types';
import type { CatalogError } from './errors';

/** Auto-generate a short internal code unique among `existing` [BR3.1]. */
export function generateInternalCode(existing: ReadonlySet<string>): string {
  let sequence = existing.size + 1;
  for (;;) {
    const candidate = `SKU-${String(sequence).padStart(4, '0')}`;
    if (!existing.has(candidate)) return candidate;
    sequence += 1;
  }
}

/**
 * Resolve create/update internal code: generate if absent; refuse collision [BR3.1].
 */
export function resolveInternalCode(
  provided: string | undefined,
  existing: ReadonlySet<string>,
): Result<string, CatalogError> {
  const trimmed = provided?.trim() ?? '';
  if (trimmed.length === 0) {
    return ok(generateInternalCode(existing));
  }
  if (existing.has(trimmed)) {
    return err({ code: 'INTERNAL_CODE_COLLISION', field: 'internalCode' });
  }
  return ok(trimmed);
}
