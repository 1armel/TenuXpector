import { arrondir } from './rounding';
import { err, ok, type ConversionError, type QuantityBase, type Result } from './types';
import type { SellingUnitView, StockMovementView } from './types';

/** Signed stock quantity = sum of base quantities [BR2.1, RG-10]. */
export function quantiteStock(movements: readonly StockMovementView[]): QuantityBase {
  let sum = 0;
  for (const m of movements) {
    sum += m.quantityBase;
  }
  return sum;
}

/** Stock state at a calendar date (inclusive) [BR2.2, EF-U1-02]. */
export function etatStockAu(
  movements: readonly StockMovementView[],
  date: string,
): QuantityBase {
  return quantiteStock(movements.filter((m) => m.operationDate <= date));
}

/**
 * Convert a sale-unit quantity (millièmes) to base milli-units [BR2.4].
 * `base = arrondir(q × factor, 1000)`.
 */
export function versUniteBase(
  saleQuantityMilli: number,
  unit: SellingUnitView,
): Result<QuantityBase, ConversionError> {
  if (unit.factorToBaseMilli < 1 || !Number.isInteger(unit.factorToBaseMilli)) {
    return err('INVALID_FACTOR');
  }
  if (!Number.isInteger(saleQuantityMilli)) {
    throw new Error('versUniteBase: quantity must be an integer [DEC-04]');
  }
  return ok(arrondir(saleQuantityMilli * unit.factorToBaseMilli, 1000));
}

/**
 * Inverse of `versUniteBase` [BR2.4].
 * `sale = arrondir(base × 1000, factor)`.
 */
export function versUniteVente(
  quantityBase: QuantityBase,
  unit: SellingUnitView,
): Result<number, ConversionError> {
  if (unit.factorToBaseMilli < 1 || !Number.isInteger(unit.factorToBaseMilli)) {
    return err('INVALID_FACTOR');
  }
  if (!Number.isInteger(quantityBase)) {
    throw new Error('versUniteVente: quantity must be an integer [DEC-04]');
  }
  return ok(arrondir(quantityBase * 1000, unit.factorToBaseMilli));
}
