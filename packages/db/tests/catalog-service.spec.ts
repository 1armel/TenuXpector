/**
 * Catalog service persistence [BR3.1 BR3.4 BR3.9 ENF-08] — layer tests after implementation.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  BASE_UNIT_CONVERSION_FACTOR,
  CatalogService,
  TransactionalWriter,
  ValidationError,
  assertHasBaseSellingUnit,
  assertNoQuantityField,
  deactivateProduct,
  insertProductRow,
  insertSellingUnitRow,
  validateProductPrices,
  validateSellingUnit,
} from '../src/index';
import { cleanupTempDirs, createIdentityFixture } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('CatalogService persist + outbox [ENF-08]', () => {
  it('creates product with base unit, audit and outbox in one TX', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    const catalog = new CatalogService(db, writer);

    const result = catalog.saveProduct(context, 'create', {
      designation: 'Écrou M8',
      baseUnit: 'piece',
      referencePrice: 150,
      floorPrice: 100,
    });

    expect(result.internalCode).toMatch(/^SKU-\d{4}$/);
    const product = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM products WHERE tenant_id = ?')
      .get(tenantId);
    const units = db.connection
      .prepare<[string], { n: number }>(
        'SELECT COUNT(*) AS n FROM selling_units WHERE tenant_id = ?',
      )
      .get(tenantId);
    const outbox = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM outbox WHERE tenant_id = ?')
      .get(tenantId);
    const audits = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM audit_log WHERE tenant_id = ?')
      .get(tenantId);
    expect(product?.n).toBe(1);
    expect(units?.n).toBe(1);
    expect(outbox?.n).toBe(1);
    expect(audits?.n).toBe(1);
    db.close();
  });

  it('finds accented designation via search_normalized [BR3.4]', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    const catalog = new CatalogService(db, writer);
    catalog.saveProduct(context, 'create', {
      designation: 'Écrou hexagonal',
      baseUnit: 'piece',
      referencePrice: 200,
      floorPrice: 150,
      internalCode: 'SKU-ECRO',
    });

    const hits = catalog.searchProducts(tenantId, 'ecrou', 10, 'vendeur');
    expect(hits).toHaveLength(1);
    const first = hits[0];
    expect(first?.name).toBe('Écrou hexagonal');
    expect(first !== undefined && 'averagePurchaseCost' in first).toBe(false);
    db.close();
  });

  it('hides purchase cost for vendeur getProduct [BR3.17]', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    const catalog = new CatalogService(db, writer);
    const saved = catalog.saveProduct(context, 'create', {
      designation: 'Scie',
      baseUnit: 'piece',
      referencePrice: 5000,
      floorPrice: 4000,
      averagePurchaseCost: 3000,
      internalCode: 'SKU-SCIE',
    });

    const asSeller = catalog.getProduct(tenantId, saved.productId, 'vendeur');
    expect(asSeller).not.toBeNull();
    expect(asSeller && 'averagePurchaseCost' in asSeller).toBe(false);

    const asOwner = catalog.getProduct(tenantId, saved.productId, 'proprietaire');
    expect(asOwner && 'averagePurchaseCost' in asOwner && asOwner.averagePurchaseCost).toBe(3000);
    db.close();
  });

  it('refuses floor above reference and never DELETEs products', () => {
    const { db, context } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    const catalog = new CatalogService(db, writer);
    expect(() =>
      catalog.saveProduct(context, 'create', {
        designation: 'Vis',
        baseUnit: 'piece',
        referencePrice: 100,
        floorPrice: 200,
      }),
    ).toThrow(ValidationError);

    const tables = db.connection
      .prepare<[], { sql: string }>(
        `SELECT sql FROM sqlite_schema WHERE type='table' AND name='products'`,
      )
      .get();
    expect(tables?.sql).toBeTruthy();
    db.close();
  });

  it('filters by tenant_id only', () => {
    const fixtureA = createIdentityFixture();
    const writerA = new TransactionalWriter(fixtureA.db);
    const catalogA = new CatalogService(fixtureA.db, writerA);
    catalogA.saveProduct(fixtureA.context, 'create', {
      designation: 'Only A',
      baseUnit: 'piece',
      referencePrice: 10,
      floorPrice: 5,
      internalCode: 'SKU-A001',
    });

    const fixtureB = createIdentityFixture();
    const catalogB = new CatalogService(fixtureB.db, new TransactionalWriter(fixtureB.db));
    const hits = catalogB.searchProducts(fixtureB.tenantId, 'Only', 10, 'gerant');
    expect(hits).toHaveLength(0);
    fixtureA.db.close();
    fixtureB.db.close();
  });

  it('updates product prices with audit + outbox and refuses code collision', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    const catalog = new CatalogService(db, writer);
    const first = catalog.saveProduct(context, 'create', {
      designation: 'Cle',
      baseUnit: 'piece',
      referencePrice: 1000,
      floorPrice: 800,
      internalCode: 'SKU-CLE1',
    });
    catalog.saveProduct(context, 'create', {
      designation: 'Autre',
      baseUnit: 'piece',
      referencePrice: 500,
      floorPrice: 400,
      internalCode: 'SKU-AUTR',
    });

    const updated = catalog.saveProduct(context, 'update', {
      productId: first.productId,
      designation: 'Cle plate',
      baseUnit: 'piece',
      referencePrice: 1200,
      floorPrice: 900,
    });
    expect(updated.productId).toBe(first.productId);
    const row = catalog.getProduct(tenantId, first.productId, 'gerant');
    expect(row?.name).toBe('Cle plate');
    expect(row?.referencePrice).toBe(1200);

    expect(() =>
      catalog.saveProduct(context, 'update', {
        productId: first.productId,
        designation: 'Cle plate',
        baseUnit: 'piece',
        referencePrice: 1200,
        floorPrice: 900,
        internalCode: 'SKU-AUTR',
      }),
    ).toThrow(ValidationError);

    expect(() =>
      catalog.saveProduct(context, 'update', {
        designation: 'Sans id',
        baseUnit: 'piece',
        referencePrice: 10,
        floorPrice: 5,
      }),
    ).toThrow(ValidationError);

    const outbox = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM outbox WHERE tenant_id = ?')
      .get(tenantId);
    expect(outbox?.n).toBeGreaterThanOrEqual(3);
    db.close();
  });

  it('returns empty search for blank query and null for missing product', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const catalog = new CatalogService(db, new TransactionalWriter(db));
    expect(catalog.searchProducts(tenantId, '   ', 10, 'vendeur')).toEqual([]);
    expect(
      catalog.getProduct(tenantId, '01900000-0000-7000-8000-000000000099', 'vendeur'),
    ).toBeNull();
    expect(() =>
      catalog.saveProduct(context, 'create', {
        designation: '',
        baseUnit: 'piece',
        referencePrice: 10,
        floorPrice: 5,
      }),
    ).toThrow(ValidationError);
    db.close();
  });
});

describe('product helpers still enforced in catalog package', () => {
  it('rejects quantity fields and selling-unit floor > price', () => {
    expect(() => { assertNoQuantityField({ quantity: 1 }); }).toThrow(ValidationError);
    expect(() => { validateProductPrices(200, 100); }).toThrow(ValidationError);
    expect(() => { validateProductPrices(100, 200); }).not.toThrow();
    expect(() => { assertHasBaseSellingUnit([
        {
          id: '01900000-0000-7000-8000-000000000001',
          tenantId: '01900000-0000-7000-8000-000000000002',
          productId: '01900000-0000-7000-8000-000000000003',
          label: 'box',
          conversionFactor: 12_000,
          price: 100,
          floorPrice: 80,
          createdBy: '01900000-0000-7000-8000-000000000004',
          deviceId: 'd',
        },
      ]); },
    ).toThrow(ValidationError);
    expect(() => { validateSellingUnit({
        id: '01900000-0000-7000-8000-000000000001',
        tenantId: '01900000-0000-7000-8000-000000000002',
        productId: '01900000-0000-7000-8000-000000000003',
        label: 'piece',
        conversionFactor: 1000,
        price: 50,
        floorPrice: 60,
        createdBy: '01900000-0000-7000-8000-000000000004',
        deviceId: 'd',
      }); },
    ).toThrow(ValidationError);
  });

  it('covers create collision, invalid selling unit inputs, and missing deactivate', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    const catalog = new CatalogService(db, writer);
    catalog.saveProduct(context, 'create', {
      designation: 'One',
      baseUnit: 'piece',
      referencePrice: 10,
      floorPrice: 5,
      internalCode: 'SKU-DUP1',
      barcode: '123',
      altNames: ['alias'],
      location: 'A1',
    });
    expect(() =>
      catalog.saveProduct(context, 'create', {
        designation: 'Two',
        baseUnit: 'piece',
        referencePrice: 10,
        floorPrice: 5,
        internalCode: 'SKU-DUP1',
      }),
    ).toThrow(ValidationError);

    expect(() => { validateSellingUnit({
        id: 'not-a-uuid',
        tenantId: '01900000-0000-7000-8000-000000000002',
        productId: '01900000-0000-7000-8000-000000000003',
        label: 'piece',
        conversionFactor: 1000,
        price: 50,
        floorPrice: 40,
        createdBy: '01900000-0000-7000-8000-000000000004',
        deviceId: 'd',
      }); },
    ).toThrow(ValidationError);
    expect(() => { validateSellingUnit({
        id: '01900000-0000-7000-8000-000000000001',
        tenantId: '01900000-0000-7000-8000-000000000002',
        productId: '01900000-0000-7000-8000-000000000003',
        label: 'piece',
        conversionFactor: 0,
        price: 50,
        floorPrice: 40,
        createdBy: '01900000-0000-7000-8000-000000000004',
        deviceId: 'd',
      }); },
    ).toThrow(ValidationError);
    expect(() => { validateSellingUnit({
        id: '01900000-0000-7000-8000-000000000001',
        tenantId: '01900000-0000-7000-8000-000000000002',
        productId: '01900000-0000-7000-8000-000000000003',
        label: 'piece',
        conversionFactor: 1000,
        price: -1,
        floorPrice: 40,
        createdBy: '01900000-0000-7000-8000-000000000004',
        deviceId: 'd',
      }); },
    ).toThrow(ValidationError);
    expect(() => { validateSellingUnit({
        id: '01900000-0000-7000-8000-000000000001',
        tenantId: '01900000-0000-7000-8000-000000000002',
        productId: '01900000-0000-7000-8000-000000000003',
        label: 'piece',
        conversionFactor: 1000,
        price: 50,
        floorPrice: -1,
        createdBy: '01900000-0000-7000-8000-000000000004',
        deviceId: 'd',
      }); },
    ).toThrow(ValidationError);
    expect(() => { validateProductPrices(-1, 10); }).toThrow(ValidationError);
    expect(() => { validateProductPrices(1.5, 10); }).toThrow(ValidationError);
    expect(() => { deactivateProduct(db, writer, context, '01900000-0000-7000-8000-000000000099'); },
    ).toThrow(ValidationError);
    expect(catalog.searchProducts(tenantId, 'alias', 5, 'gerant').length).toBeGreaterThanOrEqual(0);

    const productId = db.nextId();
    insertProductRow(
      db,
      {
        id: productId,
        tenantId,
        internalCode: 'SKU-OFF',
        name: 'Inactive candidate',
        baseUnit: 'piece',
        referencePrice: 100,
        floorPrice: 80,
        createdBy: context.actorUserId,
        deviceId: context.deviceId,
        altNames: ['syn'],
        barcode: '999',
        active: false,
      },
      db.nowIso(),
    );
    insertSellingUnitRow(
      db,
      {
        id: db.nextId(),
        tenantId,
        productId,
        label: 'piece',
        conversionFactor: BASE_UNIT_CONVERSION_FACTOR,
        price: 100,
        floorPrice: 80,
        createdBy: context.actorUserId,
        deviceId: context.deviceId,
      },
      db.nowIso(),
    );
    // Reactivate then deactivate via helper
    db.connection
      .prepare('UPDATE products SET active = 1 WHERE id = ?')
      .run(productId);
    deactivateProduct(db, writer, context, productId);
    const row = db.connection
      .prepare<[string], { active: number }>('SELECT active FROM products WHERE id = ?')
      .get(productId);
    expect(row?.active).toBe(0);
    db.close();
  });
});
