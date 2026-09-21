/**
 * Unique integer rounding function for the domain [BR1.2, RG-01].
 * Nearest integer; halves round toward +∞.
 */
export function arrondir(numerateur: number, denominateur: number): number {
  if (denominateur === 0) {
    throw new Error('arrondir: denominator must not be zero');
  }
  if (denominateur < 0) {
    throw new Error('arrondir: denominator must be positive');
  }
  if (!Number.isInteger(numerateur) || !Number.isInteger(denominateur)) {
    throw new Error('arrondir: arguments must be integers [DEC-04]');
  }

  // floor((2*num + den) / (2*den)) — nearest, half toward +∞ [RG-01]
  return Math.floor((2 * numerateur + denominateur) / (2 * denominateur));
}

/** Round a cash amount to the nearest multiple of `unit` [RG-01]. */
export function roundCashToUnit(
  amount: number,
  unit: number,
): { readonly rounded: number; readonly delta: number } {
  if (unit < 1 || !Number.isInteger(unit)) {
    throw new Error('roundCashToUnit: unit must be an integer ≥ 1');
  }
  if (!Number.isInteger(amount)) {
    throw new Error('roundCashToUnit: amount must be an integer [DEC-04]');
  }
  const rounded = arrondir(amount, unit) * unit;
  return { rounded, delta: rounded - amount };
}
