/**
 * Catalog domain rules C1 — BR3.1, BR3.2, BR3.3, BR3.4, BR3.9, BR3.17 [EF-U2-*].
 * Tests first (red → green).
 */
import { describe, expect, it } from 'vitest';
import {
  BASE_SELLING_UNIT_FACTOR_MILLI,
  buildBaseSellingUnit,
  generateInternalCode,
  matchCatalogSearch,
  normalizeSearchText,
  projectProductForRole,
  resolveInternalCode,
  validateFloorVsReference,
  validateMinimalProductCreate,
  type CatalogProductView,
} from '../src/catalog';

describe('normalizeSearchText / matchCatalogSearch [BR3.4]', () => {
  it('folds accents and case for designation fragments', () => {
    expect(normalizeSearchText('Écrou M8')).toBe('ecrou m8');
    expect(normalizeSearchText('VIS À BOIS')).toBe('vis a bois');
  });

  it('matches designation, synonym, internal code and barcode', () => {
    const haystack = {
      name: 'Écrou hexagonal',
      altNames: ['boulon', 'hex nut'],
      internalCode: 'SKU-0042',
      barcode: '3760123456789',
      active: true,
    };
    expect(matchCatalogSearch(haystack, 'ecrou')).toBe(true);
    expect(matchCatalogSearch(haystack, 'HEX')).toBe(true);
    expect(matchCatalogSearch(haystack, 'sku-0042')).toBe(true);
    expect(matchCatalogSearch(haystack, '3760123456789')).toBe(true);
  });

  it('excludes inactive products from cash-register search', () => {
    expect(
      matchCatalogSearch(
        {
          name: 'Vis',
          altNames: [],
          internalCode: 'SKU-1',
          barcode: undefined,
          active: false,
        },
        'vis',
        { includeInactive: false },
      ),
    ).toBe(false);
  });

  it('returns false for empty query or unmatched fragment', () => {
    const haystack = {
      name: 'Peinture',
      altNames: [],
      internalCode: 'SKU-9',
      barcode: undefined,
      active: true,
    };
    expect(matchCatalogSearch(haystack, '   ')).toBe(false);
    expect(matchCatalogSearch(haystack, 'plomberie')).toBe(false);
  });
});

describe('internal code [BR3.1]', () => {
  it('generates a short unique code when none is provided', () => {
    const code = generateInternalCode(new Set(['SKU-0001', 'SKU-0002']));
    expect(code).toMatch(/^SKU-\d{4}$/);
    expect(code).not.toBe('SKU-0001');
    expect(code).not.toBe('SKU-0002');
  });

  it('skips colliding auto sequence when size-based candidate exists', () => {
    expect(generateInternalCode(new Set(['SKU-0003', 'SKU-0004']))).toBe('SKU-0005');
  });

  it('refuses a colliding internal code', () => {
    const result = resolveInternalCode('SKU-0001', new Set(['SKU-0001']));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INTERNAL_CODE_COLLISION');
  });

  it('accepts a free internal code as-is', () => {
    const result = resolveInternalCode('SKU-0099', new Set(['SKU-0001']));
    expect(result).toEqual({ ok: true, value: 'SKU-0099' });
  });

  it('auto-resolves when internal code is omitted', () => {
    const result = resolveInternalCode(undefined, new Set(['SKU-0001']));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toMatch(/^SKU-\d{4}$/);
  });
});

describe('floor vs reference [BR3.2]', () => {
  it('accepts floor ≤ reference as integers FCFA', () => {
    expect(validateFloorVsReference(1000, 1500).ok).toBe(true);
    expect(validateFloorVsReference(1500, 1500).ok).toBe(true);
  });

  it('rejects floor > reference', () => {
    const result = validateFloorVsReference(2000, 1500);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FLOOR_ABOVE_REFERENCE');
  });

  it('rejects non-integer or negative money', () => {
    expect(validateFloorVsReference(10.5, 20).ok).toBe(false);
    expect(validateFloorVsReference(-1, 20).ok).toBe(false);
  });
});

describe('minimal create + base unit [BR3.9 BR3.3]', () => {
  it('accepts four required fields and builds base selling unit', () => {
    const result = validateMinimalProductCreate({
      designation: 'Marteau',
      baseUnit: 'piece',
      referencePrice: 2500,
      floorPrice: 2000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.designation).toBe('Marteau');
    const unit = buildBaseSellingUnit(result.value);
    expect(unit.conversionFactorMilli).toBe(BASE_SELLING_UNIT_FACTOR_MILLI);
    expect(unit.price).toBe(2500);
    expect(unit.floorPrice).toBe(2000);
    expect(unit.label).toBe('piece');
  });

  it('rejects missing designation or base unit', () => {
    expect(
      validateMinimalProductCreate({
        designation: '  ',
        baseUnit: 'piece',
        referencePrice: 100,
        floorPrice: 80,
      }).ok,
    ).toBe(false);
    expect(
      validateMinimalProductCreate({
        designation: 'Vis',
        baseUnit: '',
        referencePrice: 100,
        floorPrice: 80,
      }).ok,
    ).toBe(false);
  });

  it('rejects create when floor violates BR3.2', () => {
    const result = validateMinimalProductCreate({
      designation: 'Vis',
      baseUnit: 'piece',
      referencePrice: 100,
      floorPrice: 200,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FLOOR_ABOVE_REFERENCE');
  });
});

describe('seller projection [BR3.17]', () => {
  const fullProduct: CatalogProductView = {
    id: '01900000-0000-7000-8000-000000000010',
    internalCode: 'SKU-1',
    name: 'Scie',
    referencePrice: 5000,
    floorPrice: 4000,
    averagePurchaseCost: 3000,
    cump: 3100,
    margin: 1900,
    cumulativeRevenue: 50_000,
    valuation: 12_000,
    active: true,
  };

  it('strips cost fields for vendeur', () => {
    const projected = projectProductForRole(fullProduct, 'vendeur');
    expect(projected).toEqual({
      id: fullProduct.id,
      internalCode: 'SKU-1',
      name: 'Scie',
      referencePrice: 5000,
      floorPrice: 4000,
      active: true,
    });
    expect('averagePurchaseCost' in projected).toBe(false);
    expect('cump' in projected).toBe(false);
    expect('margin' in projected).toBe(false);
    expect('cumulativeRevenue' in projected).toBe(false);
    expect('valuation' in projected).toBe(false);
  });

  it('keeps cost fields for gerant and proprietaire', () => {
    expect(projectProductForRole(fullProduct, 'gerant')).toEqual(fullProduct);
    expect(projectProductForRole(fullProduct, 'proprietaire')).toEqual(fullProduct);
  });
});
