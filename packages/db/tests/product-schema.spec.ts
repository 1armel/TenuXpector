/**
 * Product / SellingUnit schema constraints [BR5.2–BR5.4].
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  BASE_UNIT_CONVERSION_FACTOR,
  TransactionalWriter,
  ValidationError,
  assertHasBaseSellingUnit,
  assertNoQuantityField,
  deactivateProduct,
  insertProductRow,
  insertSellingUnitRow,
  validateProductPrices,
} from '../src/index';
import { cleanupTempDirs, createIdentityFixture } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('Product schema [BR5.2 BR5.3 BR5.4]', () => {
  it('rejects quantity fields on product input', () => {
    expect(() => assertNoQuantityField({ name: 'x', quantity: 1 })).toThrow(ValidationError);
    expect(() => assertNoQuantityField({ name: 'x', stock_qty: 2 })).toThrow(ValidationError);
  });

  it('rejects floorPrice > referencePrice', () => {
    expect(() => validateProductPrices(200, 100)).toThrow(ValidationError);
  });

  it('requires a base selling unit with factor 1000', () => {
    expect(() =>
      assertHasBaseSellingUnit([
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
      ]),
    ).toThrow(ValidationError);
  });

  it('persists product without quantity column and deactivates via active=false', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const productId = db.nextId();
    insertProductRow(
      db,
      {
        id: productId,
        tenantId,
        internalCode: 'SKU-A',
        name: 'Bolt',
        baseUnit: 'piece',
        referencePrice: 150,
        floorPrice: 100,
        createdBy: context.actorUserId,
        deviceId: context.deviceId,
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
        price: 150,
        floorPrice: 100,
        createdBy: context.actorUserId,
        deviceId: context.deviceId,
      },
      db.nowIso(),
    );

    const columns = db.connection
      .prepare<[], { name: string }>('PRAGMA table_info(products)')
      .all()
      .map((row) => row.name);
    expect(columns).not.toContain('quantity');
    expect(columns).not.toContain('qty');

    const writer = new TransactionalWriter(db);
    deactivateProduct(db, writer, context, productId);
    const row = db.connection
      .prepare<[string], { active: number }>('SELECT active FROM products WHERE id = ?')
      .get(productId);
    expect(row?.active).toBe(0);
    db.close();
  });

  it('rejects selling unit floor > price at DB layer', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const productId = db.nextId();
    insertProductRow(
      db,
      {
        id: productId,
        tenantId,
        internalCode: 'SKU-B',
        name: 'Screw',
        baseUnit: 'piece',
        referencePrice: 50,
        floorPrice: 40,
        createdBy: context.actorUserId,
        deviceId: context.deviceId,
      },
      db.nowIso(),
    );
    expect(() =>
      insertSellingUnitRow(
        db,
        {
          id: db.nextId(),
          tenantId,
          productId,
          label: 'piece',
          conversionFactor: BASE_UNIT_CONVERSION_FACTOR,
          price: 50,
          floorPrice: 60,
          createdBy: context.actorUserId,
          deviceId: context.deviceId,
        },
        db.nowIso(),
      ),
    ).toThrow(ValidationError);
    db.close();
  });
});
