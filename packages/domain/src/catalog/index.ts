/**
 * Catalog domain public surface [BR3.1–BR3.4, BR3.9, BR3.17].
 */
export type { CatalogError, CatalogErrorCode } from './errors';
export {
  normalizeSearchText,
  buildSearchNormalized,
  matchCatalogSearch,
  type CatalogSearchHaystack,
  type CatalogSearchOptions,
} from './normalize';
export { generateInternalCode, resolveInternalCode } from './internal-code';
export {
  BASE_SELLING_UNIT_FACTOR_MILLI,
  validateFloorVsReference,
  validateMinimalProductCreate,
  buildBaseSellingUnit,
  type MinimalProductInput,
  type ValidatedMinimalProduct,
  type BaseSellingUnitDraft,
} from './product-create';
export {
  SELLER_HIDDEN_PRODUCT_FIELDS,
  projectProductForRole,
  type CatalogRole,
  type CatalogProductView,
  type SellerHiddenProductField,
} from './seller-projection';
