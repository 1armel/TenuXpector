import { arrondir } from './rounding';
import type { MoneyFcfa, PricedLine } from './types';

export interface PriceLineInput {
  readonly referencePrice: MoneyFcfa;
  readonly appliedPrice: MoneyFcfa;
  readonly floorPrice: MoneyFcfa;
  readonly saleQuantityMilli: number;
}

/**
 * Price a sale line: discount, under-floor gap, lineAmountTtc [BR4.1–BR4.2, RG-02…04].
 */
export function priceLine(input: PriceLineInput): PricedLine {
  const { referencePrice, appliedPrice, floorPrice, saleQuantityMilli } = input;
  if (saleQuantityMilli < 1 || !Number.isInteger(saleQuantityMilli)) {
    throw new Error('priceLine: saleQuantityMilli must be an integer ≥ 1');
  }

  const unitDiscount = Math.max(0, referencePrice - appliedPrice);
  const lineDiscount = arrondir(unitDiscount * saleQuantityMilli, 1000);
  const underFloor = appliedPrice < floorPrice;
  const floorGapBp =
    underFloor && floorPrice > 0
      ? Math.floor(((floorPrice - appliedPrice) * 10_000) / floorPrice)
      : 0;
  const lineAmountTtc = arrondir(appliedPrice * saleQuantityMilli, 1000);

  return {
    referencePrice,
    appliedPrice,
    floorPrice,
    saleQuantityMilli,
    lineDiscount,
    underFloor,
    floorGapBp,
    lineAmountTtc,
  };
}
