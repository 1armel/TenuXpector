/**
 * Minimal product create and base selling unit [BR3.2, BR3.3, BR3.9].
 */
import { err, ok, type MoneyFcfa, type Result } from '../types';
import type { CatalogError } from './errors';

/** Base selling unit stores factor in millièmes of base unit (DEC-04). Factor 1 → 1000. */
export const BASE_SELLING_UNIT_FACTOR_MILLI = 1000;

export interface MinimalProductInput {
  readonly designation: string;
  readonly baseUnit: string;
  readonly referencePrice: MoneyFcfa;
  readonly floorPrice: MoneyFcfa;
  readonly internalCode?: string;
}

export interface ValidatedMinimalProduct {
  readonly designation: string;
  readonly baseUnit: string;
  readonly referencePrice: MoneyFcfa;
  readonly floorPrice: MoneyFcfa;
}

export interface BaseSellingUnitDraft {
  readonly label: string;
  readonly conversionFactorMilli: number;
  readonly price: MoneyFcfa;
  readonly floorPrice: MoneyFcfa;
}

function isNonNegativeIntegerMoney(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/** prix_plancher ≤ prix_vente_reference in integer FCFA [BR3.2]. */
export function validateFloorVsReference(
  floorPrice: MoneyFcfa,
  referencePrice: MoneyFcfa,
): Result<true, CatalogError> {
  if (!isNonNegativeIntegerMoney(floorPrice) || !isNonNegativeIntegerMoney(referencePrice)) {
    return err({ code: 'INVALID_MONEY', field: 'floorPrice' });
  }
  if (floorPrice > referencePrice) {
    return err({ code: 'FLOOR_ABOVE_REFERENCE', field: 'floorPrice' });
  }
  return ok(true);
}

/** Minimal create: designation, base unit, sale price, floor [BR3.9] + BR3.2. */
export function validateMinimalProductCreate(
  input: MinimalProductInput,
): Result<ValidatedMinimalProduct, CatalogError> {
  const designation = input.designation.trim();
  if (designation.length === 0) {
    return err({ code: 'MISSING_DESIGNATION', field: 'designation' });
  }
  const baseUnit = input.baseUnit.trim();
  if (baseUnit.length === 0) {
    return err({ code: 'MISSING_BASE_UNIT', field: 'baseUnit' });
  }
  const prices = validateFloorVsReference(input.floorPrice, input.referencePrice);
  if (!prices.ok) return prices;
  return ok({
    designation,
    baseUnit,
    referencePrice: input.referencePrice,
    floorPrice: input.floorPrice,
  });
}

/** Auto base selling unit with factor 1 (stored as 1000 milli) [BR3.3]. */
export function buildBaseSellingUnit(product: ValidatedMinimalProduct): BaseSellingUnitDraft {
  return {
    label: product.baseUnit,
    conversionFactorMilli: BASE_SELLING_UNIT_FACTOR_MILLI,
    price: product.referencePrice,
    floorPrice: product.floorPrice,
  };
}
