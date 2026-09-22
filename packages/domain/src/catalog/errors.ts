/**
 * Shared catalog Result error codes [BR3.x].
 */
export type CatalogErrorCode =
  | 'INTERNAL_CODE_COLLISION'
  | 'FLOOR_ABOVE_REFERENCE'
  | 'INVALID_MONEY'
  | 'MISSING_DESIGNATION'
  | 'MISSING_BASE_UNIT';

export interface CatalogError {
  readonly code: CatalogErrorCode;
  readonly field?: string;
}
