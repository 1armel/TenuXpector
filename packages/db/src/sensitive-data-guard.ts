/**
 * SensitiveDataGuard — strips purchase cost / CUMP / margin / revenue / valuation
 * from outgoing projections when the reader is a vendeur [BR5.1].
 */

import type { UserRole } from './types';

/** Fields a vendeur must never see (§2.2 / BR5.1). */
export const SENSITIVE_PRODUCT_FIELDS = [
  'averagePurchaseCost',
  'cump',
  'margin',
  'cumulativeRevenue',
  'valuation',
] as const;

export type SensitiveProductField = (typeof SENSITIVE_PRODUCT_FIELDS)[number];

const SENSITIVE_FIELD_SET: ReadonlySet<string> = new Set(SENSITIVE_PRODUCT_FIELDS);

export interface ProductProjection {
  readonly id: string;
  readonly name: string;
  readonly referencePrice: number;
  readonly floorPrice: number;
  readonly averagePurchaseCost?: number | null;
  readonly cump?: number | null;
  readonly margin?: number | null;
  readonly cumulativeRevenue?: number | null;
  readonly valuation?: number | null;
  readonly [key: string]: unknown;
}

export function maskProductForRole<T extends ProductProjection>(
  product: T,
  role: UserRole,
): Omit<T, SensitiveProductField> {
  if (role !== 'vendeur') {
    return product;
  }
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(product)) {
    if (!SENSITIVE_FIELD_SET.has(key)) {
      safe[key] = value;
    }
  }
  return safe as Omit<T, SensitiveProductField>;
}

export function assertNoSensitiveFieldsForVendeur(
  projection: Record<string, unknown>,
  role: UserRole,
): void {
  if (role !== 'vendeur') return;
  for (const field of SENSITIVE_PRODUCT_FIELDS) {
    if (field in projection && projection[field] !== undefined) {
      throw new Error(`Sensitive field leaked to vendeur: ${field} [BR5.1]`);
    }
  }
}
