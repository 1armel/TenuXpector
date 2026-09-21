/**
 * SaleCalculator [BR5.1–BR5.3, S3, S4].
 */
import { describe, expect, it } from 'vitest';
import { priceLine } from '../src/pricing';
import {
  applyCashRoundingToPayments,
  buildPaymentPlan,
  computeSaleTotals,
  finalizeSale,
} from '../src/sale-calculator';
import { defaultParams } from './helpers';

describe('SaleCalculator totals [BR5.1–BR5.2]', () => {
  it('allocates HT with last line absorbing remainder [RG-04]', () => {
    const lines = [
      priceLine({
        referencePrice: 1000,
        appliedPrice: 1000,
        floorPrice: 800,
        saleQuantityMilli: 1000,
      }),
      priceLine({
        referencePrice: 500,
        appliedPrice: 500,
        floorPrice: 400,
        saleQuantityMilli: 1000,
      }),
    ];
    const { lines: withHt, totals } = computeSaleTotals(lines, defaultParams);
    expect(totals.totalTtc).toBe(1500);
    // totalHt = arrondir(1500*10000, 11925) = arrondir(15_000_000, 11925)
    expect(totals.totalHt + totals.vatAmount).toBe(totals.totalTtc);
    const sumHt = withHt.reduce((s, l) => s + (l.lineAmountHt ?? 0), 0);
    expect(sumHt).toBe(totals.totalHt);
  });

  it('sets totalHt = totalTtc when VAT off [S3]', () => {
    const line = priceLine({
      referencePrice: 1000,
      appliedPrice: 1000,
      floorPrice: 800,
      saleQuantityMilli: 1000,
    });
    const { totals } = computeSaleTotals([line], {
      ...defaultParams,
      vatApplicable: false,
    });
    expect(totals.totalHt).toBe(totals.totalTtc);
    expect(totals.vatAmount).toBe(0);
  });

  it('computes margin from CUMP [RG-05]', () => {
    const line = {
      ...priceLine({
        referencePrice: 1000,
        appliedPrice: 1000,
        floorPrice: 800,
        saleQuantityMilli: 1000,
      }),
      quantityBase: 24_000,
      cumpAtSale: 3500,
    };
    const { totals } = computeSaleTotals([line], {
      ...defaultParams,
      vatApplicable: false,
    });
    // cout = 84, ht = 1000, margin = 916
    expect(totals.totalMargin).toBe(1000 - 84);
  });

  it('rejects empty line list', () => {
    expect(() => computeSaleTotals([], defaultParams)).toThrow(/at least one line/);
  });

  it('allocates zero HT when totalTtc is 0 on multi-line', () => {
    const zero = {
      ...priceLine({
        referencePrice: 0,
        appliedPrice: 0,
        floorPrice: 0,
        saleQuantityMilli: 1000,
      }),
    };
    const { lines, totals } = computeSaleTotals([zero, zero], {
      ...defaultParams,
      vatApplicable: false,
    });
    expect(totals.totalTtc).toBe(0);
    expect(lines[0]?.lineAmountHt).toBe(0);
    expect(lines[1]?.lineAmountHt).toBe(0);
  });

  it('uses vatRateBp 0 when applicable but rate omitted', () => {
    const line = priceLine({
      referencePrice: 1000,
      appliedPrice: 1000,
      floorPrice: 800,
      saleQuantityMilli: 1000,
    });
    const { totals } = computeSaleTotals([line], {
      vatApplicable: true,
      cashRoundingUnit: 1,
      alertThresholds: defaultParams.alertThresholds,
    });
    expect(totals.totalHt).toBe(1000);
    expect(totals.vatAmount).toBe(0);
  });
});

describe('SaleCalculator payments [BR5.3]', () => {
  it('accepts mixed plan with credit covering total [BR5.3]', () => {
    const plan = buildPaymentPlan(
      [
        { amount: 500, mode: 'especes' },
        { amount: 500, mode: 'credit' },
      ],
      1000,
    );
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.value.changeDue).toBe(0);
      expect(plan.value.netCash).toBe(500);
    }
  });

  it('rejects insufficient payment', () => {
    expect(buildPaymentPlan([{ amount: 900, mode: 'especes' }], 1000)).toEqual({
      ok: false,
      error: 'INSUFFICIENT_PAYMENT',
    });
  });

  it('rejects change exceeding cash (mobile-only + change) [S4]', () => {
    expect(
      buildPaymentPlan([{ amount: 1200, mode: 'mtn_momo', reference: 'x' }], 1000),
    ).toEqual({ ok: false, error: 'CHANGE_EXCEEDS_CASH' });
  });

  it('allows change only up to cash total; credit counts in Σ not ceiling', () => {
    const plan = buildPaymentPlan(
      [
        { amount: 800, mode: 'especes' },
        { amount: 400, mode: 'credit' },
      ],
      1000,
    );
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.value.changeDue).toBe(200);
      expect(plan.value.netCash).toBe(600);
    }
  });

  it('rejects non-integer or zero payment amounts', () => {
    expect(() => buildPaymentPlan([{ amount: 0, mode: 'especes' }], 0)).toThrow(/amount/);
    expect(() => buildPaymentPlan([{ amount: 1.5, mode: 'especes' }], 1)).toThrow(/amount/);
  });

  it('applies cash rounding only to especes [RG-01]', () => {
    const { payments, cashRoundingDelta } = applyCashRoundingToPayments(
      [
        { amount: 1003, mode: 'especes' },
        { amount: 500, mode: 'camtel', reference: 'r' },
      ],
      25,
    );
    expect(payments[0]?.amount).toBe(1000);
    expect(payments[1]?.amount).toBe(500);
    expect(cashRoundingDelta).toBe(-3);
  });

  it('finalizeSale wires totals + plan', () => {
    const line = priceLine({
      referencePrice: 1000,
      appliedPrice: 1000,
      floorPrice: 800,
      saleQuantityMilli: 1000,
    });
    const result = finalizeSale([line], [{ amount: 1000, mode: 'especes' }], {
      ...defaultParams,
      vatApplicable: false,
      cashRoundingUnit: 1,
    });
    expect(result.ok).toBe(true);
  });

  it('finalizeSale returns payment errors', () => {
    const line = priceLine({
      referencePrice: 1000,
      appliedPrice: 1000,
      floorPrice: 800,
      saleQuantityMilli: 1000,
    });
    const result = finalizeSale([line], [{ amount: 500, mode: 'especes' }], {
      ...defaultParams,
      vatApplicable: false,
      cashRoundingUnit: 1,
    });
    expect(result).toEqual({ ok: false, error: 'INSUFFICIENT_PAYMENT' });
  });
});
