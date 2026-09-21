/**
 * Pricing [BR4.1–BR4.2, RG-02…04].
 */
import { describe, expect, it } from 'vitest';
import { priceLine } from '../src/pricing';

describe('Pricing [BR4.1–BR4.2]', () => {
  it('computes discount and lineAmountTtc [RG-02, RG-04]', () => {
    const line = priceLine({
      referencePrice: 1000,
      appliedPrice: 800,
      floorPrice: 700,
      saleQuantityMilli: 2000,
    });
    expect(line.lineDiscount).toBe(400); // (1000-800)×2
    expect(line.lineAmountTtc).toBe(1600);
    expect(line.underFloor).toBe(false);
    expect(line.floorGapBp).toBe(0);
  });

  it('flags under-floor and gap in basis points [RG-03]', () => {
    const line = priceLine({
      referencePrice: 1000,
      appliedPrice: 800,
      floorPrice: 1000,
      saleQuantityMilli: 1000,
    });
    expect(line.underFloor).toBe(true);
    // (1000-800)*10000/1000 = 2000
    expect(line.floorGapBp).toBe(2000);
  });

  it('uses zero discount when applied ≥ reference', () => {
    const line = priceLine({
      referencePrice: 500,
      appliedPrice: 500,
      floorPrice: 400,
      saleQuantityMilli: 1000,
    });
    expect(line.lineDiscount).toBe(0);
    expect(line.lineAmountTtc).toBe(500);
  });

  it('floorGapBp stays 0 when floorPrice is 0 even if underFloor', () => {
    const line = priceLine({
      referencePrice: 100,
      appliedPrice: -10,
      floorPrice: 0,
      saleQuantityMilli: 1000,
    });
    expect(line.underFloor).toBe(true);
    expect(line.floorGapBp).toBe(0);
  });

  it('rejects non-positive sale quantity', () => {
    expect(() =>
      priceLine({
        referencePrice: 100,
        appliedPrice: 100,
        floorPrice: 50,
        saleQuantityMilli: 0,
      }),
    ).toThrow(/saleQuantityMilli/);
  });
});
