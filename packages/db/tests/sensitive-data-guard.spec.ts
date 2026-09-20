/**
 * SensitiveDataGuard — vendeur must not see purchase cost / CUMP / margin / CA / valuation [BR5.1].
 * Tests first.
 */
import { describe, expect, it } from 'vitest';
import {
  assertNoSensitiveFieldsForVendeur,
  maskProductForRole,
  type ProductProjection,
} from '../src/index';

const richProduct: ProductProjection = {
  id: '01900000-0000-7000-8000-000000000001',
  name: 'Hammer',
  referencePrice: 2500,
  floorPrice: 2000,
  averagePurchaseCost: 1_500_000,
  cump: 1_600_000,
  margin: 900,
  cumulativeRevenue: 50_000,
  valuation: 12_000,
};

describe('SensitiveDataGuard [BR5.1]', () => {
  it('strips sensitive fields for vendeur', () => {
    const masked = maskProductForRole(richProduct, 'vendeur');
    expect(masked.name).toBe('Hammer');
    expect(masked.referencePrice).toBe(2500);
    expect('averagePurchaseCost' in masked).toBe(false);
    expect('cump' in masked).toBe(false);
    expect('margin' in masked).toBe(false);
    expect('cumulativeRevenue' in masked).toBe(false);
    expect('valuation' in masked).toBe(false);
  });

  it('keeps sensitive fields for gerant', () => {
    const masked = maskProductForRole(richProduct, 'gerant');
    expect(masked.averagePurchaseCost).toBe(1_500_000);
    expect(masked.cump).toBe(1_600_000);
    expect(masked.margin).toBe(900);
  });

  it('keeps sensitive fields for proprietaire', () => {
    const masked = maskProductForRole(richProduct, 'proprietaire');
    expect(masked.valuation).toBe(12_000);
    expect(masked.cumulativeRevenue).toBe(50_000);
  });

  it('assertNoSensitiveFieldsForVendeur throws when a field leaks', () => {
    expect(() =>
      assertNoSensitiveFieldsForVendeur(
        { name: 'x', averagePurchaseCost: 1 },
        'vendeur',
      ),
    ).toThrow(/Sensitive field leaked/);
  });

  it('assertNoSensitiveFieldsForVendeur is a no-op for gerant', () => {
    expect(() =>
      assertNoSensitiveFieldsForVendeur(
        { name: 'x', averagePurchaseCost: 1 },
        'gerant',
      ),
    ).not.toThrow();
  });
});
