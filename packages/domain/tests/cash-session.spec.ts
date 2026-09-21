/**
 * CashSession [BR6.1–BR6.2, RG-20, RG-21].
 */
import { describe, expect, it } from 'vitest';
import { computeSessionCashPosition, theoreticalCash } from '../src/cash-session';

describe('CashSession [BR6.1–BR6.2]', () => {
  it('computes theoretical cash [RG-20]', () => {
    expect(
      theoreticalCash({
        initialFloat: 10_000,
        netCashSales: 25_000,
        cashInflows: 5000,
        cashOutflows: 3000,
        cashRefunds: 2000,
      }),
    ).toBe(35_000);
  });

  it('computes variance and deposit [RG-21]', () => {
    const result = computeSessionCashPosition({
      initialFloat: 10_000,
      netCashSales: 20_000,
      cashInflows: 0,
      cashOutflows: 0,
      cashRefunds: 0,
      countedCash: 29_500,
      floatLeft: 5000,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.theoreticalCash).toBe(30_000);
      expect(result.value.variance).toBe(-500);
      expect(result.value.amountToDeposit).toBe(24_500);
    }
  });

  it('rejects floatLeft above countedCash', () => {
    expect(
      computeSessionCashPosition({
        initialFloat: 0,
        netCashSales: 0,
        cashInflows: 0,
        cashOutflows: 0,
        cashRefunds: 0,
        countedCash: 1000,
        floatLeft: 1001,
      }),
    ).toEqual({ ok: false, error: 'FLOAT_LEFT_OUT_OF_BOUNDS' });
  });

  it('rejects negative floatLeft', () => {
    expect(
      computeSessionCashPosition({
        initialFloat: 0,
        netCashSales: 0,
        cashInflows: 0,
        cashOutflows: 0,
        cashRefunds: 0,
        countedCash: 1000,
        floatLeft: -1,
      }),
    ).toEqual({ ok: false, error: 'FLOAT_LEFT_OUT_OF_BOUNDS' });
  });

  it('allows floatLeft equal to countedCash (full float kept)', () => {
    const result = computeSessionCashPosition({
      initialFloat: 5000,
      netCashSales: 0,
      cashInflows: 0,
      cashOutflows: 0,
      cashRefunds: 0,
      countedCash: 5000,
      floatLeft: 5000,
    });
    expect(result.ok && result.value.amountToDeposit).toBe(0);
  });
});
