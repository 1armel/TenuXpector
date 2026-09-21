/**
 * Rounding + DEC-04 types [BR1.1, BR1.2, RG-01].
 */
import { describe, expect, it } from 'vitest';
import { arrondir, roundCashToUnit } from '../src/rounding';

describe('arrondir [BR1.2, RG-01]', () => {
  it('rounds to nearest integer (happy path)', () => {
    expect(arrondir(10_000, 3)).toBe(3333); // 3333.333… → 3333
    expect(arrondir(appliedLineNumerator(), 1000)).toBe(2500);
  });

  it('rounds half toward +∞', () => {
    expect(arrondir(5, 2)).toBe(3); // 2.5 → 3
    expect(arrondir(1, 2)).toBe(1); // 0.5 → 1
    expect(arrondir(-1, 2)).toBe(0); // -0.5 → 0
    expect(arrondir(-5, 2)).toBe(-2); // -2.5 → -2
  });

  it('rejects denominator 0', () => {
    expect(() => arrondir(1, 0)).toThrow(/denominator/);
  });

  it('rejects non-integers [DEC-04]', () => {
    expect(() => arrondir(1.5, 2)).toThrow(/integers/);
    expect(() => arrondir(1, 2.5)).toThrow(/integers/);
  });

  it('rejects negative denominator', () => {
    expect(() => arrondir(-10, -3)).toThrow(/positive/);
  });
});

describe('roundCashToUnit [RG-01]', () => {
  it('rounds cash to nearest multiple of unit', () => {
    expect(roundCashToUnit(1003, 25)).toEqual({ rounded: 1000, delta: -3 });
    expect(roundCashToUnit(1013, 25)).toEqual({ rounded: 1025, delta: 12 });
  });

  it('is neutral when unit is 1', () => {
    expect(roundCashToUnit(1234, 1)).toEqual({ rounded: 1234, delta: 0 });
  });

  it('rejects non-integer cash amount', () => {
    expect(() => roundCashToUnit(100.5, 25)).toThrow(/integer/);
  });
});

function appliedLineNumerator(): number {
  return 2500 * 1000; // 2500 FCFA × 1000 millièmes
}
