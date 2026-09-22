/**
 * Seller cost masking projection [BR3.17 / CT-09].
 */
import type { MoneyFcfa } from '../types';

export type CatalogRole = 'vendeur' | 'gerant' | 'proprietaire';

export interface CatalogProductView {
  readonly id: string;
  readonly internalCode: string;
  readonly name: string;
  readonly referencePrice: MoneyFcfa;
  readonly floorPrice: MoneyFcfa;
  readonly averagePurchaseCost?: MoneyFcfa | null;
  readonly cump?: MoneyFcfa | null;
  readonly margin?: MoneyFcfa | null;
  readonly cumulativeRevenue?: MoneyFcfa | null;
  readonly valuation?: MoneyFcfa | null;
  readonly active: boolean;
}

/** Fields a vendeur must never receive [BR3.17 / CT-09]. */
export const SELLER_HIDDEN_PRODUCT_FIELDS = [
  'averagePurchaseCost',
  'cump',
  'margin',
  'cumulativeRevenue',
  'valuation',
] as const;

export type SellerHiddenProductField = (typeof SELLER_HIDDEN_PRODUCT_FIELDS)[number];

/** Role projection — vendeur never sees cost fields [BR3.17]. */
export function projectProductForRole(
  product: CatalogProductView,
  role: CatalogRole,
): CatalogProductView | Omit<CatalogProductView, SellerHiddenProductField> {
  if (role !== 'vendeur') return product;
  return {
    id: product.id,
    internalCode: product.internalCode,
    name: product.name,
    referencePrice: product.referencePrice,
    floorPrice: product.floorPrice,
    active: product.active,
  };
}
